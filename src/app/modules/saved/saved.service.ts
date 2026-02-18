import { Schema } from 'mongoose';
import { ISaved, SavedModel } from './saved.interface';
import { Saved } from './saved.model';
import { JwtPayload } from 'jsonwebtoken';
import { HotelHelper } from '../hotel/hotel.helper';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import QueryBuilder from '../../builder/QueryBuilder';

const savedHotelInfoInDB = async (hotelId: string, userId: string,type:"saved" | "favorite") => {
    const isFevorite = await Saved.isFevorite(hotelId, userId, type);
console.log(isFevorite);

    if(isFevorite){
        await Saved.findOneAndDelete({ hotelId, user: userId,type });
        
    }
    else{
        await Saved.create({ hotelId, user: userId,type });
        
    }
    await RedisHelper.keyDelete(`hotels:saved:${userId}:*`);
}


const savedHotelsFromDB = async (user:JwtPayload,query:Record<string,any>) => {
    const cache = await RedisHelper.redisGet(`hotels:saved:${user.id}`, query);
    if(cache) return cache
    const savedQuery = new QueryBuilder(Saved.find({user:user.id}), query).paginate().sort().filter()
    const [savedHotels,pagination] = await Promise.all([
        savedQuery.modelQuery.distinct('hotelId').exec(),
        savedQuery.getPaginationInfo()
    ])


    if(!savedHotels.length) return {data:[],pagination}

    
    const hotelsInfos = await HotelHelper.getBulkHotelsInfos(savedHotels)
   
    
    await RedisHelper.redisSet(`hotels:saved:${user.id}`, {data:hotelsInfos,pagination}, query, 60 * 60 * 24);
    return {data:hotelsInfos,pagination}
}

export const SavedServices = {
    savedHotelInfoInDB,
    savedHotelsFromDB,
};
