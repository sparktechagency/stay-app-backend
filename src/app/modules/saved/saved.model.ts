import { Schema, model } from 'mongoose';
import { ISaved, SavedModel } from './saved.interface'; 

const savedSchema = new Schema<ISaved, SavedModel>({
  hotelId: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['saved', 'favorite'],
    required: true
  }
},{
    timestamps:true
});

savedSchema.statics.isFevorite = async function (hotelId: string, userId: string, ask: 'saved' | 'favorite'='saved') {
  const isFevorite = await this.findOne({ hotelId, user: userId,type:ask });
  return !!isFevorite;
};

savedSchema.index({ user: 1, hotelId: 1 });

export const Saved = model<ISaved, SavedModel>('Saved', savedSchema);
