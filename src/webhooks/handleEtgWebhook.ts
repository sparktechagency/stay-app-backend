
import { Request, Response } from "express";
import crypto from "crypto";
import { Booking } from "../app/modules/booking/booking.model";
import { RedisHelper } from "../tools/redis/redis.helper";


export const etgWebhookHandler = async (req: Request, res: Response) => {
  try {
    const { data, signature } = req.body;

    if (!data || !signature) {
      return res.status(400).json({ message: "Invalid payload structure" });
    }

    const { partner_order_id, status } = data;
    console.log(partner_order_id,status);
    
    // const { signature: receivedSignature, timestamp, token } = signature;

    // // 1️⃣ Verify Timestamp (optional but recommended)
    // const currentTime = Math.floor(Date.now() / 1000);
    // const TOKEN_LIFETIME = 300; // 5 minutes

    // if (Math.abs(currentTime - timestamp) > TOKEN_LIFETIME) {
    //   return res.status(400).json({ message: "Expired webhook timestamp" });
    // }

    // // 2️⃣ Verify Signature
    // const generatedSignature = crypto
    //   .createHmac("sha256", process.env.ETG_API_KEY as string)
    //   .update(timestamp.toString().concat(token))
    //   .digest("hex");

    // if (generatedSignature !== receivedSignature) {
    //   return res.status(401).json({ message: "Invalid signature" });
    // }

    // // 3️⃣ Prevent Replay Attack (optional but recommended)
    // const existingToken = await RedisHelper.redisGet(`etg:webhook:${token}`);
    // if (existingToken) {
    //   return res.status(400).json({ message: "Replay attack detected" });
    // }

    // await RedisHelper.redisSet(`etg:webhook:${token}`, "processed", {}, TOKEN_LIFETIME);

    // 4️⃣ Update Booking Status
    const booking = await Booking.findOne({
      booking_id: partner_order_id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (status === "completed") {
      booking.status = "Confirmed";
    } else if (status === "failed") {
      booking.status = "Failed";
    }
    else if (status === "cancelled") {
      booking.status = "Cancelled";
    }

    await booking.save();

    // 5️⃣ Respond 200 so ETG won't retry
    return res.status(200).json({ message: "Webhook processed successfully" });

  } catch (error) {
    console.error("ETG Webhook Error:", error);

    // Return 500 → ETG will retry
    return res.status(500).json({ message: "Internal server error" });
  }
};