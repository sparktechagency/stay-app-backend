import { Schema, model } from 'mongoose';
import { IHotel, HotelModel } from './hotel.interface'; 

const hotelSchema = new Schema<IHotel, HotelModel>({
  // Define schema fields here
});

export const Hotel = model<IHotel, HotelModel>('Hotel', hotelSchema);
