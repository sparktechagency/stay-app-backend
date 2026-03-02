import { Request, Response } from "express";
import stripe from "../config/stripe";
import config from "../config";
import { handlePurchaseCheckout } from "../handlers/handlePurchaseCheckout";
import { handleSubscriptionCreated } from "../handlers/handleSubscriptionCreated";
import { kafkaProducer } from "../tools/kafka/kafka-producers/kafka.producer";

export const handleStripeWebhook = async (req: Request, res: Response) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event = await stripe.webhooks.constructEvent(req.body, sig!, config.stripe.webhook_secret!);

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const isBooking = session.metadata?.bookingId ? true : false;
                if(isBooking){
                    await kafkaProducer.sendMessage('user',{
                        type:'book-hotel',
                        data:{
                            session
                        }
                     })
                }
                break;
            case 'customer.subscription.created':
                const subscription = event.data.object;
                await handleSubscriptionCreated(subscription);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.log(error);
        
    }
}