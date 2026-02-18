import mongoose from "mongoose";
import { IPackage, PackageModel } from "./package.interface";


const packageSchema = new mongoose.Schema<IPackage,PackageModel>({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    priceId: {
        type: String,
    },
    product: {
        type: String,
    },
    payment_link: {
        type: String,
    },
    type: {
        type: String,
        enum: ['Free', 'Basic', 'Premium'],
        required: false,
        default: 'Free'
    },
    features: {
        type: [String],
        required: true,
    },
    paymentId: {
        type: String,
    },
    referenceId: {
        type: String,
    },
    recurring: {
        type: String,
        enum: ['month', 'year'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'delete'],
        default: 'active',
    },
    interval: {
        type: Number,
        default: 1
    },
},{
    timestamps: true
})

export const Package = mongoose.model<IPackage, PackageModel>("Package", packageSchema);