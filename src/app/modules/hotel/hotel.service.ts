import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { googleMapHelper } from '../../../helpers/googleMapHelper';
import {
  HotelModel,
  HotelRateRequest,
  HotelSearchRequest,
  IStartBookingRequest,
} from './hotel.interface';
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
import stripe from '../../../config/stripe';
const searchHotelsUsingGeoCode = async (
  data: HotelSearchRequest,
  user: JwtPayload,
  { page, limit }: { page: number; limit: number } = { page: 1, limit: 3 },
) => {
  // const cache = await RedisHelper.redisGet('hotels', data);
  // if (cache) return cache;

  const destinationLatLong = await googleMapHelper.getGeoCodeUsingAddress(
    data?.destination || 'Dubai',
  );

  if (destinationLatLong.lat == 0 || destinationLatLong.lng == 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Destination not found');
  }

  // const cehcedData = await HotelHelper.getDataFromCacheGeoCode(
  //   destinationLatLong.lat,
  //   destinationLatLong.lng,
  // );
  // if (cehcedData?.length) {
  //   // await RedisHelper.redisSet('hotels', cehcedData, data, 60 * 60 * 24);
  //   const startIndex = (page - 1) * limit;
  //   const endIndex = page * limit;
  //   const hotels = cehcedData.slice(startIndex, endIndex);
  //   return {
  //     hotels,
  //     total_hotels: cehcedData.length,
  //   };
  // }

  let tempData = data as any;
  delete tempData.page;
  delete tempData.limit;

  let hotels = await RedisHelper.redisGet('hotels:temp', tempData);

  if (!hotels) {
    hotels = await redhawkHelper.getHotelsByGeoCode({
      checkin: data?.checkin || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      checkout: data?.checkout || new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
      // residency: address?.country?.short_name?.toLowerCase() || 'us',
      currency: 'EUR',
      guests: [
        {
          adults: data?.geusts || 1,
          children: [],
        },
      ],
      language: 'en',
      latitude: destinationLatLong.lat,
      longitude: destinationLatLong.lng,
      radius: data.radius || 1000,
      star_rating: data.star_rating ||5,
    });
    await RedisHelper.redisSet('hotels:temp', hotels, tempData, 60 * 60);
    // await kafkaProducer.sendMessage('user', {
    //   type: 'cache-hotels',
    //   data: {
    //     data: hotels.hotels,
    //     lat: destinationLatLong.lat,
    //     lng: destinationLatLong.lng,
    //   },
    // });
  }

  // console.log(hotels);
  // console.log(hotels.hotels);

  // paginate hotels data with page and limit
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  console.log(page, limit);

  hotels.hotels = hotels.hotels.slice(startIndex, endIndex);

  const formattedHotels = await HotelHelper.convertRawResponseToLocal(
    hotels.hotels,
    user,
  );

  const result = {
    hotels: formattedHotels,
    total_hotels: hotels.total_hotels,
  };

  // await RedisHelper.redisSet('hotels', result, data, 60 * 60 * 24);
  return result;
};

const getHotelInformationUsingId = async (id: string) => {
  const cache = await RedisHelper.redisGet('hotels', { id });
  if (cache) return cache;
  const hotelInformation = await redhawkHelper.getHotelInformationUsingId(id);
  if (!hotelInformation)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Hotel not found');
  const data = HotelHelper.formatHotelToAppJson(hotelInformation);
  await RedisHelper.redisSet('hotels', data, { id }, 60 * 60 * 24);
  return data;
};

const hotelAutoCompleteResponse = async (address: string) => {
  if (address.length < 2) return [];

  const cache = await RedisHelper.redisGet('hotels:autocomplete', { address });

  if (cache) {
    return cache;
  }

  const data = (await redhawkHelper.autoCompleteAddress(address)).map(
    hotel => hotel.id,
  );

  const infos = await HotelHelper.getBulkHotelsInfos(data);

  await RedisHelper.redisSet('hotels:autocomplete', infos, { address }, 60 * 2);
  return infos;
};

const getHotelRatesResponse = async (
  payload: HotelRateRequest,
  user: JwtPayload,
) => {
  const cache = await RedisHelper.redisGet(
    `hotels:rates:${user.id}:${payload.id}`,
    payload,
  );
  if (cache) return cache;
  const data = await redhawkHelper.getHotelPage({
    checkin: payload.checkin,
    checkout: payload.checkout,
    currency: 'EUR',
    guests: [
      {
        adults: payload.geusts,
        children: payload?.childrens||[],
      },
    ],
    language: 'en',
    id: payload.id,
  });

  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, 'Hotel not found');

  const userInfo = await User.findById(user.id);
  if (!userInfo) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  const response = {
    booking_id: getRandomId('ST-', 5),
    user: {
      name: userInfo.name,
      email: userInfo.email,
      contact: userInfo.contact,
    },
    total_person: payload.geusts + (payload?.childrens?.length || 0),
    dates: {
      checkin: payload.checkin,
      checkout: payload.checkout,
    },
    total_days:
      (new Date(payload.checkout).getTime() -
        new Date(payload.checkin).getTime()) /
      86400000,
    rates: data?.[0]?.rates?.map(rate => ({
      total_price:
        rate.payment_options.payment_types[0].recommended_price?.show_amount ||
        rate.payment_options.payment_types[0]?.show_amount,
      currency:
        rate.payment_options.payment_types[0].recommended_price
          ?.currency_code ||
        rate.payment_options.payment_types[0]?.currency_code,
      room_name: rate.room_name,
      book_hash: rate.book_hash,
      daily_prices: rate.daily_prices,
      meal: rate.meal,
      free_cancellation:
        rate.payment_options.payment_types[0]?.cancellation_penalties
          ?.free_cancellation_before,
    })),
    hotel_id: payload.id,
  };

  await RedisHelper.redisSet(
    `hotels-process:${response.booking_id}`,
    response,
    {},
    60 * 60 * 24,
  );

  await RedisHelper.redisSet(
    `hotels:rates:${user.id}:${payload.id}`,
    response,
    payload,
    60,
  );
  return response;
};

const getRealtimePriceFromPrebook = async (
  book_hash: string,
  booking_id: string,
) => {
  const cache = await RedisHelper.redisGet('hotels:realtime', { book_hash });
  if (cache) return cache;
  const response = await redhawkHelper.chackRealPriceBeforeBook(book_hash);

  if (!response) throw new ApiError(StatusCodes.NOT_FOUND, 'Hotel not found');

  const currentPrice = response.hotels[0]?.rates?.[0];
  const total_price =
    currentPrice?.payment_options?.payment_types[0]?.recommended_price
      ?.show_amount ||
    currentPrice?.payment_options?.payment_types[0]?.show_amount;
  const priceBreakdown = HotelHelper.getPriceWithCharge(Number(total_price));

  const data = {
    total_price: priceBreakdown.price.toFixed(2),
    charge: priceBreakdown.charge,
    currency:
      currentPrice?.payment_options?.payment_types[0]?.recommended_price
        ?.currency_code ||
      currentPrice?.payment_options?.payment_types[0]?.currency_code,
    room_name: currentPrice?.room_name,
    book_hash: currentPrice?.book_hash,
    daily_prices: currentPrice?.daily_prices,
    meal: currentPrice?.meal,
    free_cancellation:
      currentPrice?.payment_options?.payment_types[0]?.cancellation_penalties
        ?.free_cancellation_before,
    hotel_id: response.hotels[0]?.id,
  } as IRateDataFormat;

  await RedisHelper.redisSet(
    'hotels:realtime',
    data,
    { book_hash: booking_id },
    60 * 60 * 24,
  );
  return data;
};

const startTheBookingProcess = async (
  payload: IStartBookingRequest,
  user: JwtPayload,
) => {
  const bookingResponse = await redhawkHelper.startTheBookingProcess(
    payload.booking_id,
    payload.book_hash,
  );
  const paymentType = bookingResponse.payment_types?.find(
    item => item.type == 'deposit' && item.currency_code == 'EUR',
  );
  if (!paymentType) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Payment type not found');
  }

  const userInfo = await User.findById(user.id);

  if (!userInfo) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  if (!userInfo.contact) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User contact not found');
  }
  const [first_name, last_name] = userInfo.name.split(' ');
  const payloadk = {
    language: 'en',
    partner: {
      partner_order_id: payload.booking_id,
    },
    payment_type: {
      type: paymentType.type as 'deposit' | 'now',
      amount: paymentType.amount,
      currency_code: paymentType.currency_code,
    },
    rooms: [
      {
        guests: payload.guests,
      },
    ],
    user: {
      email: userInfo.email,
      phone: userInfo.contact,
      comment: `Booking for ${userInfo.name}`,
    },
    supplier_data: {
      first_name_original: first_name,
      last_name_original: last_name || 'user',
      phone: userInfo.contact,
      email: userInfo.email,
    },
  };
  const response = {
    booking_id: payload.booking_id,
    book_hash: payload.book_hash,
    userId: user.id,
    payload: payloadk,
  };

  await RedisHelper.redisSet(
    `hotels:booking_process:${user.id}:${payload.booking_id}`,
    response,
    {},
    60 * 60 * 24,
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: paymentType.currency_code,
          product_data: {
            name: `Hotel Booking - ${payload.booking_id}`,
          },
          unit_amount: Math.round(
            HotelHelper.getPriceWithCharge(Number(paymentType.amount)).price *
              100,
          ), // Stripe expects amount in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `http://localhost:3000/booking-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:3000/booking-cancelled`,
    metadata: {
      bookingId: payload.booking_id,
      userId: user.id,
    },
  });

  if (session.url) {
    return {
      checkout_url: session.url,
    };
  }
};

export const HotelServices = {
  searchHotelsUsingGeoCode,
  getHotelInformationUsingId,
  hotelAutoCompleteResponse,
  getHotelRatesResponse,
  getRealtimePriceFromPrebook,
  startTheBookingProcess,
};
