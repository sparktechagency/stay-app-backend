import { Schema, model } from 'mongoose';
import { IBooking, BookingModel } from './booking.interface'; 

const bookingSchema = new Schema<IBooking, BookingModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hotel_id: {
    type: String,
    required: true,
  },
  total_person: {
    type: Number,
    required: true,
  },
  hotel_name: {
    type: String,
    required: true,
  },
  hotel_image: {
    type: String,
    required: true,
  },
  check_in: {
    type: Date,
    required: true,
  },
  check_out: {
    type: Date,
    required: true,
  },
  total_price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending',
  },
  total_days:{
    type:Number,
    required:true
  },
  room_name:{
    type:String,
    required:true
  },
  currency:{
    type:String,
    required:false,
    default:'EUR'
  },
  book_hash:{
    type:String,
    required:true
  },
  rating:{
    type:Number,
    default:0
  },
  payment_intent_id:{
    type:String,
    required:false
  },
  charge:{
    type:Number,
    required:true
  },
  meal:{
    type:String,
    required:false
  },
  free_cancellation:{
    type:String,
    required:false
  },
  booking_id:{
    type:String,
    required:true,
    unique:true
  },
  user_check_in:{
    date:Date,
    status:Boolean,
  },
  user_check_out:{
    date:Date,
    status:Boolean
  }
}, {
  timestamps: true,
});
bookingSchema.index({user:1})
bookingSchema.index({booking_id:1})
export const Booking = model<IBooking, BookingModel>('Booking', bookingSchema);
