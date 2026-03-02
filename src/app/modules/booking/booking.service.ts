import { JwtPayload } from 'jsonwebtoken';
import { BookingModel } from './booking.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { Booking } from './booking.model';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import ApiError from '../../../errors/ApiError';
import { redhawkHelper } from '../../../helpers/redhawkHelper';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../notification/notification.interface';
import stripe from '../../../config/stripe';
import { imageFormatHelper } from '../../../helpers/imageFormatHelper';



const getAllBookings = async (query:Record<string, any>,user:JwtPayload) =>{
    const existCache = await RedisHelper.redisGet(`bookings:${user.id}`,query);
    if(existCache) return existCache
    const bookingQuery = new QueryBuilder(Booking.find({user:user.id}), query).paginate().sort().filter()
    let [bookings,pagination] = await Promise.all([
        bookingQuery.modelQuery.exec(),
        bookingQuery.getPaginationInfo()
    ])
    console.log(bookings);
    
    bookings =bookings?.map((booking:any) => {
        return {
            ...booking.toJSON(),
            hotel_image:imageFormatHelper([booking.hotel_image])[0]
        }
    }) as any
    await RedisHelper.redisSet(`bookings:${user.id}`, {data:bookings,pagination}, query, 60 * 60 );
    return {data:bookings,pagination}
}

const getBookingById = async (id:string,user:JwtPayload) => {
    const existCache = await RedisHelper.redisGet(`booking:${id}`,{userId:user.id});
    if(existCache) return existCache
    const booking = await Booking.findOne({_id:id,user:user.id})
    await RedisHelper.redisSet(`booking:${id}`, booking, {userId:user.id}, 60 * 60 );
    return booking
}

const cancelBooking = async (id:string,user:JwtPayload) => {
    const booking = await Booking.findOne({_id:id,user:user.id})
    if(!booking) {
        throw new ApiError(404,'Booking not found')
    }
    if(['Cancelled','Completed'].includes(booking.status)) {
        throw new ApiError(400,'Booking is already cancelled or completed')
    }

    const status = await redhawkHelper.cancelBooking(booking.booking_id)
    if(status !== 'ok') {
        throw new ApiError(400,'Failed to cancel booking')
    }
    booking.status = 'Cancelled'
   // Step 1: Save first (must complete)
await booking.save();

// Step 2: Run others in parallel
await kafkaProducer.sendMessage("user", {
    type: "cancel-booking",
    data: {
        bookingId: booking.booking_id,
    },
})
    return booking
}



const checkInCheckoutHotel = async (id:string,status:"checkin" | "checkout") => {
    const booking = await Booking.findOne({_id:id})
    if(!booking) {
        throw new ApiError(404,'Booking not found')
    }

    if(status=="checkin" && booking?.user_check_in?.status){
        throw new ApiError(400,'You have already checked in')
    }

    if(status=="checkout" && booking?.user_check_out?.status){
        throw new ApiError(400,'You have already checked out')
    }

    if(status=="checkin") {
        booking.user_check_in = {
            date:new Date(),
            status:true
        }
        await booking.save()
        return booking
    }

    if(status=="checkout") {
        booking.user_check_out = {
            date:new Date(),
            status:true
        }
        await booking.save()
        return booking
    }
}


export const BookingServices = {
    getAllBookings,
    getBookingById,
    cancelBooking,
    checkInCheckoutHotel
};
