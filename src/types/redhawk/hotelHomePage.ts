// Payment type info
export interface VatData {
  included: boolean;
  amount: string;
  currency_code: string;
  value: string;
}

export interface CommissionInfoDetail {
  amount_gross: string;
  amount_net: string;
  amount_commission: string;
}

export interface CommissionInfo {
  show: CommissionInfoDetail;
  charge: CommissionInfoDetail;
}

export interface CancellationPolicy {
  start_at: string | null;
  end_at: string | null;
  amount_charge: string;
  amount_show: string;
  commission_info: CommissionInfo;
}

export interface PaymentType {
  amount: string;
  show_amount: string;
  currency_code: string;
  show_currency_code: string;
  by: string | null;
  is_need_credit_card_data: boolean;
  is_need_cvc: boolean;
  type: string;
  vat_data: VatData;
  tax_data: Record<string, unknown>;
  perks: Record<string, unknown>;
  commission_info: CommissionInfo;
  cancellation_penalties: {
    policies: CancellationPolicy[];
    free_cancellation_before: string;
  };
  recommended_price: {
    amount: string;
    show_amount: string;
    currency_code: string;
    show_currency_code: string;
  };
}

export interface PaymentOptions {
  payment_types: PaymentType[];
}

// Rate for a room
export interface HotelRate {
  book_hash: string;
  match_hash: string;
  daily_prices: string[];
  meal: string;
  payment_options: PaymentOptions;
  bar_rate_price_data: any | null;
  rg_ext: {
    class: number;
    quality: number;
    sex: number;
    bathroom: number;
    bedding: number;
    family: number;
    capacity: number;
    club: number;
  };
  room_name: string;
  room_name_info: string | null;
  serp_filters: string[];
  sell_price_limits: any | null;
  allotment: number;
  amenities_data: string[];
  any_residency: boolean;
}

// Deposit / No-show
export interface Deposit {
  amount: string;
  currency_code: string;
  is_refundable: boolean;
}

export interface NoShow {
  amount: string;
  currency_code: string;
  from_time: string;
}

// Room translation info
export interface RoomDataTrans {
  main_room_type: string;
  main_name: string;
  bathroom: string | null;
  bedding_type: string;
  misc_room_type: string | null;
}

// Hotel
export interface HotelDetail {
  id: string;
  rates: HotelRate[];
  bar_price_data: any | null;
  deposit: Deposit;
  no_show: NoShow;
  room_data_trans: RoomDataTrans;
}

// Debug info
export interface DebugRequestGuest {
  adults: number;
  children: any[];
}

export interface DebugRequest {
  checkin: string;
  checkout: string;
  residency: string;
  language: string;
  guests: DebugRequestGuest[];
  id: string;
  currency: string;
}

export interface DebugInfo {
  request: DebugRequest;
  key_id: number;
  validation_error: string | null;
}

// Data wrapper
export interface HotelSearchData {
  hotels: HotelDetail[];
  changes?:{
    price_changed: boolean
  }
}

// Root API response
export interface HotelRatesResponse {
  data: HotelSearchData;
  debug: DebugInfo;
  status: "ok" | "error";
  error: string | null;
}




export interface IRateDataFormat {
  total_price: string;
  currency: string;
  room_name: string;
  book_hash: string;
  daily_prices: string[];
  meal: string;
  free_cancellation: string; // ISO date string
  hotel_id: string;
}
