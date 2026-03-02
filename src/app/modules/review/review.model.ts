import { Schema, model } from 'mongoose';
import { IReview, ReviewModel } from './review.interface'; 

const reviewSchema = new Schema<IReview, ReviewModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  review: {
    type: String,
    required: true,
  },
  hotelId: {
    type: String,
    required: true,
  },
},{
    timestamps: true
});

export const Review = model<IReview, ReviewModel>('Review', reviewSchema);
