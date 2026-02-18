import mongoose from "mongoose";
import Stripe from "stripe";


import stripe from "../config/stripe";
import { Package } from "../app/modules/package/package.model";
import { User } from "../app/modules/user/user.model";
import { Subscription } from "../app/modules/subscription/subscription.model";
import { getRandomId } from "../shared/getRandomId";




export const handleSubscriptionCreated = async (event: Stripe.Subscription) => {
    const mongooseSession = await mongoose.startSession();
    try {
        mongooseSession.startTransaction();
        // console.log(event);
        
        const subscription = await stripe.subscriptions.retrieve(event.id,{expand:["latest_invoice.payment_intent"]});
        
        if(!subscription){
            throw new Error("Subscription not found");
        }
        const invoice = subscription.latest_invoice as Stripe.Invoice
        const item = invoice?.lines?.data[0];
        if(!item){
            throw new Error("Invoice not found");
        }

        const startDate = new Date(item.period.start * 1000);
        const endDate = new Date(item.period.end * 1000);
        
        

        const price_id = subscription?.items?.data[0]?.price.id;
        if(!price_id){
            console.log("price_id not found");
            return
        }
        const packageData = await Package.findOne({priceId:price_id}).lean();
        console.log(price_id);
        
        if(!packageData){
            throw new Error("Package not found");
        }
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if(!customer){
            throw new Error("Customer not found");
            
        }

        
        

        const user = await User.findOne({email: (customer as any).email}).lean()

        if(!user){
            throw new Error("User not found");
        }

        const existingSubscription = await Subscription.findById(user.subscription)
        if(existingSubscription){

            await Subscription.findByIdAndUpdate(user.subscription,{status:"inactive"},{session:mongooseSession})
        }


        const newSubscription = await Subscription.create([{
            subscriptionId: event.id,
            status: "active",
            user: user._id,
            package: packageData._id,
            startDate:startDate,
            endDate:endDate,
            price:packageData.price,
            name:packageData.name,
            txId:(event.latest_invoice as any)?.payment_intent as string || getRandomId('TRX',6)
        }],{session:mongooseSession}) 


        
        

      const udata=  await User.findByIdAndUpdate(user._id,{subscription:newSubscription[0]._id},{session:mongooseSession,new:true}).lean()
    
      


        await mongooseSession.commitTransaction()
        await mongooseSession.endSession()

    return newSubscription
        
    } catch (error) {
        await mongooseSession.abortTransaction()
        await mongooseSession.endSession()
        console.log(error);
        
        
    }
    
}