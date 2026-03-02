import mongoose from 'mongoose';
import { Booking } from '../app/modules/booking/booking.model';
import { RedisHelper } from '../tools/redis/redis.helper';
import stripe from '../config/stripe';
import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';

export const handleBookingCancel = async (bookingId: string) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const booking = await Booking.findOne({ _id: bookingId }).populate('user').session(session);
    if (!booking) {
      throw new Error('Booking not found');
    }
    await Promise.all([
      RedisHelper.keyDelete(`bookings:${booking.user}:*`),
      RedisHelper.keyDelete(`booking:${booking._id}:*`),
      stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: Math.round((booking.total_price - booking.charge) * 100),
      }),
      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: 'Booking Cancelled',
          message: `Your booking for ${booking.hotel_name} has been cancelled.`,
          receiver: [
            booking.user.toString(),
          ],
          isRead: false,
          filePath: 'booking',
          referenceId: booking._id.toString() as any,
        },
      }),

      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: 'Booking Cancelled',
          message: `${(booking?.user as any)?.name || 'A user'} has cancelled their booking for ${booking.hotel_name}. Booking ID: ${booking.booking_id}`,
          isRead: false,
          filePath: 'booking',
          referenceId: booking._id.toString() as any,
        },
      }),
    ]);
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    console.log(error);
    
    await session.abortTransaction();
    session.endSession();
  }
};
