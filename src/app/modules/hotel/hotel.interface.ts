import { Model } from 'mongoose';

export type IHotel = {
  // Define the interface for Hotel here
};

export type HotelModel = Model<IHotel>;

export type HotelSearchRequest = {
  destination: string;
  checkin: string;
  checkout: string;
  geusts: number;
  star_rating?: number;
  radius?: number;
}

export type HotelRateRequest = {
  checkin: string;
  checkout: string;
  geusts: number;
  id: string;
}


export type IStartBookingRequest = {
  booking_id: string;
  book_hash: string;
  guests:{first_name: string; last_name: string}[]
}
