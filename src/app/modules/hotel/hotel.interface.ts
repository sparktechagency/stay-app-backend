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
  lat: number;
  lng: number;
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
  first_name: string;
  last_name:string,
  cvc: string;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  card_holder: string
}
