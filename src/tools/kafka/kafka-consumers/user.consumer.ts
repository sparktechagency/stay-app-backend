import { HotelHelper } from "../../../app/modules/hotel/hotel.helper";
import { SavedServices } from "../../../app/modules/saved/saved.service";
import { kafkaConsumer } from "../kafka-producers/kafka.consumer"

export const userConsumer = async ()=>{
    await kafkaConsumer({groupId:"user",topic:"user",cb:async (data:{type:string,data:any})=>{
        try {
            switch (data.type) {
                case "saved":
                    await SavedServices.savedHotelInfoInDB(data.data.hotelId, data.data.userId,data.data.type);
                    break;
                case "cache-hotels":
                    await HotelHelper.savedCacheData(data.data.data,data.data.lat,data.data.lng);
                    break;
                case "delete":
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.log(error);
            
        }
    }})
}