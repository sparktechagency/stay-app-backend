import { query } from 'express';
import { z } from 'zod';

const searchHotelsUsingGeoCodeZodSchema = z.object({
  body: z
    .object({
      destination: z.string().min(2, 'Destination is required').optional(),

      checkin: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          'Invalid check-in date format (YYYY-MM-DD)',
        ).optional(),

      checkout: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          'Invalid check-out date format (YYYY-MM-DD)',
        ).optional(),

      geusts: z.number().int().min(1, 'At least 1 guest is required').optional(),
      star_rating: z.number().int().min(1).max(5).optional(),
      radius: z.number().optional(),
      // lat: z
      //   .number()
      //   .min(-90)
      //   .max(90),

      // lng: z
      //   .number()
      //   .min(-180)
      //   .max(180),
    })
    .refine(data =>(!data?.checkin || !data?.checkout) || new Date(data?.checkout ) > new Date(data?.checkin), {
      message: 'Checkout date must be after check-in date',
      path: ['checkout'],
    }),
});

const searchHotelsAutoCompleteZodSchema = z.object({
  query: z.object({
    searchTerm: z.string({ required_error: 'Search term is required' }),
  }),
});

const getHotelRatesZodSchema = z.object({
  body: z.object({
    id: z.string({ required_error: 'Hotel id is required' }),
    checkin: z.string({ required_error: 'Checkin is required' }),
    checkout: z.string({ required_error: 'Checkout is required' }),
    geusts: z.number({ required_error: 'Guests is required' }),
    childrens: z.array(z.number()).optional(),
  }),
});

const preBookPriceZodSchema = z.object({
  query: z.object({
    book_hash: z.string({ required_error: 'Book hash is required' }),
    booking_id: z.string({ required_error: 'Booking id is required' }),
  }),
});

const startTheBookingProcessZodSchema = z.object({
  body: z.object({
    booking_id: z.string(),

    book_hash: z.string(),
    guests: z.array(
      z.object({
        first_name: z.string({ required_error: 'First name is required' }),
        last_name: z.string({ required_error: 'Last name is required' }),
      }),
    ),
  }),
});

export const HotelValidations = {
  searchHotelsUsingGeoCodeZodSchema,
  searchHotelsAutoCompleteZodSchema,
  getHotelRatesZodSchema,
  preBookPriceZodSchema,
  startTheBookingProcessZodSchema,
};
