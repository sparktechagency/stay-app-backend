import Stripe from 'stripe';
import stripe from '../config/stripe';
import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';
import { RedisHelper } from '../tools/redis/redis.helper';
import { redhawkHelper } from '../helpers/redhawkHelper';
import { Booking } from '../app/modules/booking/booking.model';
import mongoose from 'mongoose';
import { IBookingProcessInfo } from '../types/redhawk/bookingProcessInfo';
import { INotification } from '../app/modules/notification/notification.interface';

export const handleBookingOrder = async (session: Stripe.Checkout.Session) => {
  const mongoSession = await mongoose.startSession();
  try {
    mongoSession.startTransaction();
    const { userId, bookingId } = session.metadata || {};
    if (!userId || !bookingId) {
      throw new Error('Missing userId or bookingId in session metadata');
    }
   
    
    const cacheInfo = await RedisHelper.redisGet(
      `hotels:booking_process:${userId}:${bookingId}`,
    );

    
    if (!cacheInfo) {
      throw new Error('No cache info found for this booking process');
    }
    const payload = cacheInfo.payload;

    
    const bookingInfo: IBookingProcessInfo = await RedisHelper.redisGet(
      `hotels-process:${bookingId}`,
    );

    if (!bookingInfo) {
      throw new Error('No booking info found for this booking process');
    }

    const hotelInfo = await redhawkHelper.getHotelInformationUsingId(
      bookingInfo.hotel_id,
    );

    const roomInfo = await RedisHelper.redisGet(`hotels:realtime`, {
      book_hash: bookingId,
    });
    if (!roomInfo) {
      throw new Error('No room info found for this booking process');
    }
    const bookingResponse = await redhawkHelper.confirmBooking(payload);

    if (bookingResponse !== 'ok') {
      throw new Error('Booking confirmation failed');
    }

    const bookingPayload =  {
          user: userId,
          booking_id: bookingId,
          hotel_name: hotelInfo.name,
          check_in: bookingInfo.dates.checkin,
          check_out: bookingInfo.dates.checkout,
          total_days: bookingInfo.total_days,
          total_person: bookingInfo.total_person,
          total_price: ((session?.amount_total || 0) / 100).toFixed(2),
          currency: session.currency,
          room_name: roomInfo.room_name,
          payment_intent_id: session.payment_intent,
          book_hash: cacheInfo.book_hash,
          hotel_id: bookingInfo.hotel_id,
          hotel_image: hotelInfo.images?.[0] || '',
          meal: roomInfo.meal,
          free_cancellation: roomInfo.free_cancellation,
          charge: roomInfo.charge,
        }
        
    const booking = await Booking.create(
      [
       bookingPayload,
      ],
      {
        session: mongoSession,
      },
    );

    if (!booking || booking.length === 0) {
      throw new Error('Booking creation failed');
    }

    await Promise.all([
      await RedisHelper.keyDelete(`bookings:${userId}:*`),
      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: 'Booking Confirmed',
          message: `Your booking with session ID ${session.id} has been confirmed.`,
          receiver: [session.metadata?.userId as any],
          filePath: 'booking',
          referenceId: booking[0]._id.toString() as any,
          isRead: false,
        } as INotification,
      }),
      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: 'New Booking on your platform',
          message: `${bookingId} has been booked`,
          filePath: 'booking',
          referenceId: booking[0]._id.toString(),
          isRead: false,
        },
      }),
    ]);

    await RedisHelper.keyDelete(
      `hotels:booking_process:${userId}:${bookingId}:*`,
    );
    await RedisHelper.keyDelete(
      `hotels-process:${bookingResponse.booking_id}:*`,
    );

    await mongoSession.commitTransaction();
    await mongoSession.endSession();
  } catch (error) {
    await mongoSession.abortTransaction();
    await mongoSession.endSession();
    console.error('Error handling booking order:', error);
    await stripe.refunds.create({
      payment_intent: session.payment_intent as string,
      reason: 'requested_by_customer',
    });
    await kafkaProducer.sendMessage('utils', {
      type: 'notification',
      data: {
        title: 'Booking Failed',
        message: `Your booking with session ID ${session.id} has failed. The payment has been refunded.`,
        receiver: [session.metadata?.userId],
        filePath: 'booking',
        referenceId: session.metadata?.userId,
      },
    });
  }
};
