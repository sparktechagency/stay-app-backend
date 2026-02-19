 export interface HotelSearchRequest {
  checkin: string;   // YYYY-MM-DD
  checkout: string;  // YYYY-MM-DD
  residency?: string;
  language: string;
  guests: Guest[];
  longitude: number;
  latitude: number;
  radius: number;
  currency: string;
  id?:string
  star_rating?:number,
  has_breakfast?:boolean
}

 interface Guest {
  adults: number;
  children: number[];
}


export interface HotelSearchResponse {
  data: Data;
  debug: Debug;
  status: string;
  error: string | null;
}

interface Data {
  hotels: IHotel[];
  total_hotels: number;
}

export interface IHotel {
  id: string;
  hid: string;
  rates: Rate[];
  bar_price_data: any | null;
}

 export interface Rate {
  match_hash: string;
  daily_prices: string[];
  meal: string;
  payment_options: PaymentOptions;
  bar_rate_price_data: any | null;
  rg_ext: RgExt;
  room_name: string;
  room_name_info?: string | null;
  serp_filters: string[];
  sell_price_limits: any | null;
  allotment: number | null;
  amenities_data: string[];
  any_residency: boolean;
  deposit: Deposit | null;
  no_show: NoShow | null;
  room_data_trans: RoomDataTrans;
}

 interface PaymentOptions {
  payment_types: PaymentType[];
}

 interface PaymentType {
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
  cancellation_penalties: CancellationPenalties;
  recommended_price: RecommendedPrice;
}

 interface VatData {
  included: boolean;
  value: string;
}

 interface CommissionInfo {
  show: CommissionAmount;
  charge: CommissionAmount;
}

 interface CommissionAmount {
  amount_gross: string;
  amount_net: string;
  amount_commission: string;
}

 interface CancellationPenalties {
  policies: CancellationPolicy[];
  free_cancellation_before: string;
}

 interface CancellationPolicy {
  start_at: string | null;
  end_at: string | null;
  amount_charge: string;
  amount_show: string;
  commission_info: CommissionInfo;
}

 interface RecommendedPrice {
  amount: string;
  currency_code: string;
  show_amount: string;
  show_currency_code: string;
}

 interface Deposit {
  amount: string;
  currency_code: string;
  is_refundable: boolean;
}

 interface NoShow {
  amount: string;
  currency_code: string;
  from_time: string;
}

 interface RoomDataTrans {
  main_room_type: string;
  main_name: string;
  bathroom: string | null;
  bedding_type: string;
  misc_room_type: string | null;
}

 interface RgExt {
  class: number;
  quality: number;
  sex: number;
  bathroom: number;
  bedding: number;
  family: number;
  capacity: number;
  club: number;
}

 interface Debug {
  request: DebugRequest;
  key_id: number;
  validation_error: string | null;
}

 interface DebugRequest {
  checkin: string;
  checkout: string;
  residency: string;
  language: string;
  guests: Guest[];
  longitude: number;
  latitude: number;
  radius: number;
  currency: string;
}

 interface Guest {
  adults: number;
  children: number[];
}
