import { Model, Types } from 'mongoose';

export type IReview = {
  user:Types.ObjectId;
  booking:Types.ObjectId;
  rating:number;
  review:string,
  hotelId:string
};

export type ReviewModel = Model<IReview>;
