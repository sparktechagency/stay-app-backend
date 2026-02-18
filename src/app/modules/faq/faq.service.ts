import { RedisHelper } from "../../../tools/redis/redis.helper";
import { IFaq } from "./faq.interface";
import { Faq } from "./faq.model";

const createFaqToDB = async (data:IFaq)=>{
    const createFaq = await Faq.create(data)
    await RedisHelper.keyDelete('faqs:*')
    return createFaq
}


const updateFaqToDB = async (id:string,data:Partial<IFaq>)=>{
    const updateFaq = await Faq.findOneAndUpdate({_id:id},data,{new:true})
    await RedisHelper.keyDelete('faqs:*')
    return updateFaq

}

const deleteFaqFromDb = async (id:string)=>{
    const deletFaq = await Faq.findOneAndDelete({_id:id})
    await RedisHelper.keyDelete('faqs:*')
    return deletFaq
}

const getFaqs = async ()=>{
    const cache = await RedisHelper.redisGet('faqs')
    if(cache) return cache
    const faqs= await Faq.find().lean()
    await RedisHelper.redisSet('faqs',faqs,{},60*60*24)
    return faqs
}

export const FaqService = {
    createFaqToDB,
    updateFaqToDB,
    deleteFaqFromDb,
    getFaqs
}