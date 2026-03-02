export interface IBookingProcessInfo {
  booking_id: string;
  user: BookingUser;
  total_person: number;
  dates: BookingDates;
  total_days: number;
  rates: Rate[];
  hotel_id: string;
}

export interface BookingUser {
  name: string;
  email: string;
  contact: string;
}

export interface BookingDates {
  checkin: string;   // ISO Date (YYYY-MM-DD)
  checkout: string;  // ISO Date (YYYY-MM-DD)
}

export interface Rate {
  total_price: string;        // keeping string because API returns string
  currency: string;
  room_name: string;
  book_hash: string;
  daily_prices: string[];
  meal: string;
  free_cancellation: string | null; // nullable
}