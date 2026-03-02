import { Model, Types } from 'mongoose';

export type IBooking = {
  user:Types.ObjectId,
  booking_id:string,
  hotel_id:string,
  hotel_name:string,
  hotel_image:string,
  check_in:Date,
  check_out:Date,
  total_price:number,
  charge:number,
  payment_intent_id:string,
  status:"Pending" | "Confirmed" | "Cancelled" | "Failed",
  total_days:number,
  total_person:number,
  room_name:string,
  currency:string,
  book_hash:string,
  rating:number,
  meal:string,
  free_cancellation:string
  user_check_in?:{
    date:Date,
    status:boolean
  }
  user_check_out?:{
    date:Date,
    status:boolean
  }
};

export type BookingModel = Model<IBooking>;
