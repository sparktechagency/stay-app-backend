import { z } from 'zod';

const checkinCheckoutZodSchema = z.object({
    body: z.object({
        status: z.enum(['checkin', 'checkout'], {
            required_error: 'Status is required',
        })
    }),
})



export const BookingValidations = {
    checkinCheckoutZodSchema
 };
