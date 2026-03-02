import { Model, Types } from "mongoose";

export type INotification = {
  receiver?: Types.ObjectId[];
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: Date;
  filePath?: "booking" | "payment" | "general" | "review";
  referenceId?: Types.ObjectId;
  readers?: Types.ObjectId[];
};

export type NotificationModel = Model<INotification>;
