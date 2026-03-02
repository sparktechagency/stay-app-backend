import { z } from 'zod';

const createReviewZodSchema = z.object({
    body: z.object({
        rating: z.number({ required_error: 'Rating is required' }).min(1).max(5),
        review: z.string({ required_error: 'Comment is required' }),
        booking: z.string({ required_error: 'Booking id is required' }).refine((value) => {
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(value);
            return isValidObjectId;
        }),
    }),
});

export const ReviewValidations = {
    createReviewZodSchema,
};
