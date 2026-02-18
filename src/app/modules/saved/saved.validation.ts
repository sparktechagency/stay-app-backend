import { z } from 'zod';

const savedHotelInfoInDBZodSchema = z.object({
    body: z.object({
        hotelId: z.string({ required_error: 'Hotel id is required' }),
        type: z.enum(['saved', 'favorite'], {
            required_error: 'Type is required',
        }),
    }),
})


export const SavedValidations = {
    savedHotelInfoInDBZodSchema
};
