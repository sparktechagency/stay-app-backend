import { Model, Types } from 'mongoose';

export type ISaved = {
  hotelId: string;
  user:Types.ObjectId,
  type:"saved" | "favorite"
};

export type SavedModel = Model<ISaved> & {
  isFevorite:(id:string,userId:string,as?:"saved" | "favorite")=>Promise<boolean>
}
