import { Model } from "mongoose";


export type IPackage = {
    name: string
    price: number;
    priceId?: string,
    payment_link?: string,
    product?: string,
    type:"Free"|"Basic"|"Premium",
    features: string[];
    status: "active" | "delete";
    paymentId: string
    referenceId: string,
    recurring:"month"|"year"|"week",
    interval?:number
}

export type PackageModel = Model<IPackage>