// ==============================
// Root Booking Interface
// ==============================
export interface CreateBookingRequest {
  arrival_datetime?: string; // ISO DateTime string (optional)

  language: string;

  partner: Partner;

  payment_type: PaymentType;

  upsell_data?: UpsellData[];

  return_path?: string;

  rooms: Room[];

  user: User;

  supplier_data?: SupplierData;
}

// ==============================
// User
// ==============================
interface User {
  email: string;
  comment?: string;
  phone: string;
}

// ==============================
// Supplier Data
// ==============================
export interface SupplierData {
  first_name_original: string;
  last_name_original: string;
  phone: string;
  email: string;
}

// ==============================
// Partner
// ==============================
export interface Partner {
  partner_order_id: string;
  comment?: string;
  amount_sell_b2b2c?: string; // API sends as string
}

// ==============================
// Payment Type
// ==============================
export interface PaymentType {
  type: "deposit" | "now"  // adjust if more types exist
  amount: string;
  currency_code: string;
}

// ==============================
// Upsell Data
// ==============================
export interface UpsellData {
  name: string;
  uid: string;
}

// ==============================
// Rooms
// ==============================
export interface Room {
  guests: Guest[];
}

export interface Guest {
  first_name: string;
  last_name: string;
}