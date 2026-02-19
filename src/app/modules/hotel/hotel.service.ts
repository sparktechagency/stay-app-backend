import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { googleMapHelper } from '../../../helpers/googleMapHelper';
import { HotelModel, HotelRateRequest, HotelSearchRequest, IStartBookingRequest } from './hotel.interface';
import { redhawkHelper } from '../../../helpers/redhawkHelper';
import { HotelHelper } from './hotel.helper';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import { getRandomId } from '../../../shared/getRandomId';
import { Saved } from '../saved/saved.model';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { IRateDataFormat } from '../../../types/redhawk/hotelHomePage';
import crypto from 'crypto';
import { PaymentRequest } from '../../../types/redhawk/startBooking';
const searchHotelsUsingGeoCode = async (data:HotelSearchRequest,user:JwtPayload) => {
    const cache = await RedisHelper.redisGet('hotels', data);
    if(cache) return cache
    const destinationLatLong = await googleMapHelper.getGeoCodeUsingAddress(data.destination);

    if(destinationLatLong.lat == 0 || destinationLatLong.lng == 0) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Destination not found');
    }

    const cehcedData = await HotelHelper.getDataFromCacheGeoCode(destinationLatLong.lat,destinationLatLong.lng)
    if(cehcedData?.length) {
        await RedisHelper.redisSet('hotels', cehcedData, data, 60 * 60 * 24);
        return cehcedData
    }
    
    const hotels = await redhawkHelper.getHotelsByGeoCode({
        checkin: data.checkin,
        checkout: data.checkout,
        // residency: address?.country?.short_name?.toLowerCase() || 'us',
        currency:"EUR",
        guests:[
            {
            adults: data.geusts,
            children:[]
        }],
        language:"en",
        latitude: destinationLatLong.lat,
        longitude: destinationLatLong.lng,
        radius: data.radius || 100,
        star_rating: data.star_rating
    })

    const formattedHotels = HotelHelper.convertRawResponseToLocal(hotels.hotels)

    await kafkaProducer.sendMessage('user',{
        type: 'cache-hotels',
        data: {
            data:formattedHotels,
            lat:destinationLatLong.lat,
            lng:destinationLatLong.lng
        }
    })
    const result= {
        hotels:await Promise.all(formattedHotels.map(async (hotel) => {
            const [isFevorite,isSaved] = await Promise.all([
                Saved.isFevorite(hotel?.id!,user?.id,'favorite'),
                Saved.isFevorite(hotel?.id!,user?.id,'saved')
            ])
            return {
                ...hotel,
                isFevorite,
                isSaved
            }
        })),
        total_hotels:hotels.total_hotels
    }

    await RedisHelper.redisSet('hotels', result, data, 60 * 60 * 24);
    return result
}


const getHotelInformationUsingId = async (id: string) => {
    const cache = await RedisHelper.redisGet('hotels', {id});
    if(cache) return cache
    const hotelInformation = await redhawkHelper.getHotelInformationUsingId(id)
    if(!hotelInformation) throw new ApiError(StatusCodes.NOT_FOUND, 'Hotel not found')
    const data= HotelHelper.formatHotelToAppJson(hotelInformation)
    await RedisHelper.redisSet('hotels', data, {id}, 60 * 60 * 24);
    return data
}


const hotelAutoCompleteResponse = async (address: string) => {
    if(address.length < 2) return []

    const cache = await RedisHelper.redisGet('hotels:autocomplete', {address});
    
    if(cache) {
        return cache
    }

    const data = (await redhawkHelper.autoCompleteAddress(address)).map(hotel=>hotel.id)
    
    const infos = await HotelHelper.getBulkHotelsInfos(data)
   

    await RedisHelper.redisSet('hotels:autocomplete', infos, {address}, 60 *2);
    return infos
}

const getHotelRatesResponse = async (payload:HotelRateRequest,user:JwtPayload)=>{
    const cache = await RedisHelper.redisGet(`hotels:rates:${user.id}:${payload.id}`, payload);
    if(cache) return cache
    const data = await redhawkHelper.getHotelPage({
        checkin: payload.checkin,
        checkout: payload.checkout,
        currency:"EUR",
        guests:[
            {
            adults: payload.geusts,
            children:[]
        }],
        language:"en",
        id:payload.id
    })

    if(!data) throw new ApiError(StatusCodes.NOT_FOUND, 'Hotel not found')

    const userInfo = await User.findById(user.id)
    if(!userInfo) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    const response = {
        booking_id:getRandomId("ST-",5),
        user:{
            name:userInfo.name,
            email:userInfo.email,
            contact:userInfo.contact,
        },
        total_person:payload.geusts,
        dates:{
            checkin:payload.checkin,
            checkout:payload.checkout
        },
        total_days:(new Date(payload.checkout).getTime() - new Date(payload.checkin).getTime())/86400000,
        rates:data?.[0]?.rates?.map(rate=>({
            total_price:rate.payment_options.payment_types[0].recommended_price?.show_amount || rate.payment_options.payment_types[0]?.show_amount,
            currency:rate.payment_options.payment_types[0].recommended_price?.currency_code || rate.payment_options.payment_types[0]?.currency_code,
            room_name:rate.room_name,
            book_hash:rate.book_hash,
            daily_prices:rate.daily_prices,
            meal:rate.meal,
            free_cancellation:rate.payment_options.payment_types[0]?.cancellation_penalties?.free_cancellation_before
        })),
        hotel_id:payload.id
    }

    await RedisHelper.redisSet(`hotels:rates:${user.id}:${payload.id}`, response, payload, 60);
    return response
}

const getRealtimePriceFromPrebook = async (book_hash:string)=>{
    const cache = await RedisHelper.redisGet('hotels:realtime', {book_hash});
    if(cache) return cache
    const response = await redhawkHelper.chackRealPriceBeforeBook(book_hash)

    if(!response) throw new ApiError(StatusCodes.NOT_FOUND, 'Hotel not found')
    
    const currentPrice = response.hotels[0]?.rates?.[0]
    const total_price = currentPrice?.payment_options?.payment_types[0]?.recommended_price?.show_amount || currentPrice?.payment_options?.payment_types[0]?.show_amount
    const priceBreakdown = HotelHelper.getPriceWithCharge(Number(total_price))

    const data= {
        total_price:priceBreakdown.price.toFixed(2),
        charge:priceBreakdown.charge,
        currency:currentPrice?.payment_options?.payment_types[0]?.recommended_price?.currency_code || currentPrice?.payment_options?.payment_types[0]?.currency_code,
        room_name:currentPrice?.room_name,
        book_hash:currentPrice?.book_hash,
        daily_prices:currentPrice?.daily_prices,
        meal:currentPrice?.meal,
        free_cancellation:currentPrice?.payment_options?.payment_types[0]?.cancellation_penalties?.free_cancellation_before,
    } as IRateDataFormat

    await RedisHelper.redisSet('hotels:realtime', data, {book_hash}, 60 * 60 * 24);
    return data
}


const startTheBookingProcess = async (payload:IStartBookingRequest,user:JwtPayload)=>{
    const bookingResponse = await redhawkHelper.startTheBookingProcess(payload.booking_id,payload.book_hash)

    const response = {
        booking_id:payload.booking_id,
        
    }

    return response
}


export const HotelServices = {
    searchHotelsUsingGeoCode,
    getHotelInformationUsingId,
    hotelAutoCompleteResponse,
    getHotelRatesResponse,
    getRealtimePriceFromPrebook,
    startTheBookingProcess
};
