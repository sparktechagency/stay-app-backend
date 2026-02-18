import { query } from 'express';
import { z } from 'zod';

const searchHotelsUsingGeoCodeZodSchema = z.object({
    body: z.object({
  destination: z.string().min(2, "Destination is required"),

  checkin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date format (YYYY-MM-DD)"),

  checkout: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date format (YYYY-MM-DD)"),

  geusts: z
    .number()
    .int()
    .min(1, "At least 1 guest is required"),

  lat: z
    .number()
    .min(-90)
    .max(90),

  lng: z
    .number()
    .min(-180)
    .max(180),
})
.refine(
  (data) => new Date(data.checkout) > new Date(data.checkin),
  {
    message: "Checkout date must be after check-in date",
    path: ["checkout"],
  }
)
})

const searchHotelsAutoCompleteZodSchema = z.object({
    query:z.object({
        searchTerm:z.string({required_error:"Search term is required"})
    })
})

const getHotelRatesZodSchema = z.object({
    body:z.object({
        id:z.string({required_error:"Hotel id is required"}),
        checkin:z.string({required_error:"Checkin is required"}),
        checkout:z.string({required_error:"Checkout is required"}),
        geusts:z.number({required_error:"Guests is required"})
    })
})


const preBookPriceZodSchema = z.object({
  query:z.object({
    book_hash:z.string({required_error:"Book hash is required"})
  })
})


const startTheBookingProcessZodSchema = z.object({
  body:z.object({
  booking_id: z
    .string(),

  book_hash: z
    .string(),

  first_name: z
    .string()
    .min(1, 'First name is required'),

  last_name: z
    .string()
    .min(1, 'Last name is required'),

  cvc: z
    .string()
    .regex(/^\d{3,4}$/, 'Invalid CVC'),

  card_number: z
    .string()
    .regex(/^\d{13,19}$/, 'Invalid card number'),

  expiry_month: z
    .string()
    .regex(/^(0[1-9]|1[0-2])$/, 'Invalid expiry month'),

  expiry_year: z
    .string()
    .regex(/^\d{2}$/, 'Invalid expiry year'),

  card_holder: z
    .string()
    .min(1, 'Card holder name is required'),
})
})

export const HotelValidations = {
    searchHotelsUsingGeoCodeZodSchema,
    searchHotelsAutoCompleteZodSchema,
    getHotelRatesZodSchema,
    preBookPriceZodSchema,
    startTheBookingProcessZodSchema
 };
