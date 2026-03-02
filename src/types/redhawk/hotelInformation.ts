// HotelData.ts

export interface HotelData {
  address: string;
  amenity_groups: AmenityGroup[];
  check_in_time: string;       // "15:00:00"
  check_out_time: string;      // "12:00:00"
  description_struct: DescriptionSection[];
  email: string;
  facts: HotelFacts;
  front_desk_time_end: string;   // "04:00:00"
  front_desk_time_start: string; // "14:00:00"
  hotel_chain: string;
  id: string;                    // "crowne_plaza_berlin_city_centre"
  images: string[];
  is_closed: boolean;
  kind: "Hotel";
  latitude: number;
  longitude: number;
  metapolicy_extra_info: string;
  metapolicy_struct: MetapolicyStruct;
  name: string;
  payment_methods: string[];
  phone: string;
  policy_struct: PolicySection[];
  postal_code: string;
  region: Region;
  room_groups: RoomGroup[];
  serp_filters: string[];
  star_certificate: null | unknown; // usually null in this case
  star_rating: number;
}

export interface AmenityGroup {
  amenities: string[];
  group_name: string;
}

export interface DescriptionSection {
  paragraphs: string[];
  title: string;
}

export interface HotelFacts {
  electricity: {
    frequency: number[];
    sockets: string[];     // "c", "f"
    voltage: number[];
  };
  floors_number: number;
  rooms_number: number;
  year_built: number;
  year_renovated: number;
}

export interface MetapolicyStruct {
  add_fee: any[];
  children: any[];
  children_meal: ChildMealPolicy[];
  cot: any[];
  deposit: DepositPolicy[];
  extra_bed: ExtraBedPolicy[];
  internet: any[];
  meal: MealPolicy[];
  no_show: NoShowPolicy;
  parking: ParkingPolicy[];
  pets: PetPolicy[];
  shuttle: any[];
  visa: {
    visa_support: string; // "unspecified"
  };
}

export interface ChildMealPolicy {
  age_end: number;
  age_start: number;
  currency: string;
  inclusion: string;      // "not_included"
  meal_type: string;
  price: string;
}

export interface DepositPolicy {
  availability: string;
  currency: string;
  deposit_type: string;
  payment_type: string;
  price: string;
  price_unit: string;
  pricing_method: string;
}

export interface ExtraBedPolicy {
  amount: number;
  currency: string;
  inclusion: string;
  price: string;
  price_unit: string;
}

export interface MealPolicy {
  currency: string;
  inclusion: string;
  meal_type: string;
  price: string;
}

export interface NoShowPolicy {
  availability: string;
  day_period: string;
  time: string | null;
}

export interface ParkingPolicy {
  currency: string;
  inclusion: string;
  price: string;
  price_unit: string;
  territory_type: string;
}

export interface PetPolicy {
  currency: string;
  inclusion: string;
  pets_type: string;
  price: string;
  price_unit: string;
}

export interface Region {
  country_code: string;  // "DE"
  iata: string;          // "BER"
  id: number;
  name: string;          // "Berlin"
  type: string;          // "City"
}

export interface RoomGroup {
  images: string[];
  name: string;
  name_struct: RoomNameStruct;
  rg_ext: RoomGroupExtension;
  room_amenities: string[];
  room_group_id: number;
}

export interface RoomNameStruct {
  bathroom: string | null;
  bedding_type: string | null;
  main_name: string;
}

export interface RoomGroupExtension {
  bathroom: number;
  bedding: number;
  capacity: number;
  class: number;
  club: number;
  family: number;
  quality: number;
  sex: number;
}

export interface PolicySection {
  paragraphs: string[];
  title: string;
}

export interface HotelDetailOutput {
  hotel: {
    id: string;
    name: string;
    rating: number;
    location: {
      address: string;
      city: string;
      postal_code: string;
      country_code: string;
    };
  };
  room_or_property: {
    description: string;
    notes?: string[];
  };
  amenities: Array<{
    category: string;
    items: string[];
  }>;
  check_in_out: {
    check_in: string;   // e.g. "15:00"
    check_out: string;  // e.g. "12:00"
  };
  pricing_example?: {
    total: number | null;
    currency: string;
    nights: number;
    date_range: string;
  };
  map: {
    latitude: number;
    longitude: number;
    google_maps_link: string;
  };
  images?: {
    main?: string;
    gallery?: string[];
  };
  all_amenities?: string[];
  meta_policy?: string[];
  extra_meta_policy?: string
}