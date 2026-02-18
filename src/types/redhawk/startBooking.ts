export interface CreditCardCore {
  year: string;
  card_number: string;
  card_holder: string;
  month: string;
}

export interface PaymentRequest {
  object_id: number;
  pay_uuid: string;
  init_uuid: string;
  user_first_name: string;
  user_last_name: string;
  cvc: string;
  is_cvc_required: boolean;
  credit_card_data_core: CreditCardCore;
}








/// Boooking response types
export interface StartBookingResponse {
  data: PaymentData;
  debug: unknown | null;
  error: unknown | null;
  status: 'ok' | string;
}

/* -------------------- DATA -------------------- */

export interface PaymentData {
  item_id: number;
  order_id: number;
  partner_order_id: string;
  payment_types: PaymentType[];
  upsell_data: UpsellItem[];
}

/* -------------------- PAYMENT TYPES -------------------- */

export interface PaymentType {
  amount: string;
  currency_code: string;
  is_need_credit_card_data: boolean;
  is_need_cvc: boolean;
  type: 'deposit' | 'now' | string;
  recommended_price?: RecommendedPrice;
}

export interface RecommendedPrice {
  amount: string;
  currency_code: string;
  show_amount: string;
  show_currency_code: string;
}

/* -------------------- UPSELL -------------------- */

export interface UpsellItem {
  charge_price: Price;
  data: UpsellTimeData;
  name: 'late_checkout' | 'early_checkin' | string;
  rule_id: number;
  uid: string;
}

export interface Price {
  amount: string;
  currency_code: string;
}

export interface UpsellTimeData {
  checkout_time?: string; // HH:mm:ss
  checkin_time?: string;  // HH:mm:ss
}
