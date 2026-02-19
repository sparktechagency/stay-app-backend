import { redisClient } from "../../../config/redis";
import { redhawkHelper } from "../../../helpers/redhawkHelper";
import { RedisHelper } from "../../../tools/redis/redis.helper";
import { IHotel, HotelSearchResponse, Rate } from "../../../types/redhawk/getHotelsUsingGeoCode";
import { HotelData, HotelDetailOutput } from "../../../types/redhawk/hotelInformation";

export function mapHotelToCard(
  hotel: IHotel,
  options?: {
    hotelName?: string;
    location?: string;
    rating?: number;
    image?: string;
    discountPercent?: number;
  }
) {
    
  const rates: Rate[] = hotel.rates || [];

  if (!rates.length) return null;

  // find cheapest rate
  const cheapestRate = rates.reduce((prev, curr) => {
    const prevPrice = Math.min(...prev.daily_prices.map(Number));
    const currPrice = Math.min(...curr.daily_prices.map(Number));
    return currPrice < prevPrice ? curr : prev;
  });

  const pricePerNight = Math.min(
    ...cheapestRate.daily_prices.map(Number)
  );

  const discount = options?.discountPercent ?? 20;

  const originalPrice = Math.round(
    pricePerNight / (1 - discount / 100)
  );

  const payment =
    cheapestRate.payment_options?.payment_types?.[0];

  return {
    id: hotel.id,
    hid: hotel.hid,

    name: formatHotelName(hotel.id) ?? "Hotel Blue sky",
    location: options?.location ?? "Africa City",
    meal: cheapestRate.meal,
    rating: options?.rating ?? 4.7,

    image:
      options?.image ??
      "https://placeholder-hotel-image.com/default.jpg",

    roomType: cheapestRate.room_name,

    discountPercent: discount,

    originalPrice,
    pricePerNight,

    currency: payment?.currency_code ?? "USD"
  };
}

function formatHotelName(slug: string): string {
  return slug
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const convertRawResponseToLocal = (response: HotelSearchResponse["data"]["hotels"]) => {
    return response?.map((hotel) => mapHotelToCard(hotel))
}

function formatHotelToAppJson(hotel: HotelData): HotelDetailOutput {
  // Extract key fields (adjust property names if your JSON uses different keys)
  const name = hotel.name || "Unnamed Hotel";
  const rating = hotel.star_rating || 0;
  const address = hotel.address || "";
  const city = hotel.region?.name || "";
  const postalCode = hotel.postal_code || "";
  const countryCode = hotel.region?.country_code || "";

  // Main description - prefer "Rooms" or first meaningful paragraph
  let description = "";
  if (hotel.description_struct) {
    const roomSection = hotel.description_struct.find(
      (s: any) => s.title === "Rooms" || s.title.includes("room")
    );
    if (roomSection && roomSection.paragraphs?.length) {
      description = roomSection.paragraphs.join("\n\n");
    } else if (hotel.description_struct[0]?.paragraphs?.length) {
      description = hotel.description_struct[0].paragraphs.join("\n\n");
    }
  }

  // Simple notes / special info
  const notes: string[] = [];
  if (hotel.policy_struct) {
    hotel.policy_struct.forEach((p: any) => {
      if (p.title === "Extra info" || p.title === "Special living conditions") {
        p.paragraphs.forEach((para: string) => notes.push(para));
      }
    });
  }

  // Grouped amenities (similar to your screenshot style)
  const amenityCategories: Record<string, Set<string>> = {};

  if (hotel.amenity_groups) {
    hotel.amenity_groups.forEach((group: any) => {
      const cat = group.group_name;
      if (!amenityCategories[cat]) {
        amenityCategories[cat] = new Set();
      }
      group.amenities.forEach((item: string) => {
        amenityCategories[cat].add(item);
      });
    });
  }

  const amenities = Object.entries(amenityCategories)
    .map(([category, items]) => ({
      category,
      items: Array.from(items).sort(),
    }))
    .filter(c => c.items.length > 0);

  // Check-in / out
  const checkIn = hotel.check_in_time?.substring(0, 5) || "Flexible";
  const checkOut = hotel.check_out_time?.substring(0, 5) || "Flexible";

  // Map link
  const lat = hotel.latitude || 0;
  const lng = hotel.longitude || 0;
  const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : "";

  // Pricing placeholder (your original JSON didn't have real price)
  const pricing = {
    total:null ,
    currency: "USD",
    nights: 2,
    date_range: "example dates",
  };

  // Images (first few from the array)
  const images = hotel.images || [];
  const outputImages = images.length > 0 ? {
    main: images[0],
    gallery: images.slice(0, images.length > 5 ? 5 : images.length),
  } : undefined;

  return {
    hotel: {
      name,
      rating,
      location: {
        address,
        city,
        postal_code: postalCode,
        country_code: countryCode,
      },
    },
    room_or_property: {
      description: description.trim() || "No description available",
      notes: notes.length > 0 ? notes : undefined,
    },
    amenities,
    check_in_out: {
      check_in: checkIn,
      check_out: checkOut,
    },
    pricing_example: pricing,
    map: {
      latitude: lat,
      longitude: lng,
      google_maps_link: mapsLink,
    },
    images: outputImages,
  };
}


async function getBulkHotelsInfos(ids:string[]) {
  const cache = await RedisHelper.redisGet('hotels', {ids});
  if(cache) return cache
  let uncacheIds:string[] = []
  let data = await Promise.all(ids.map(async (id) => {
    const cache = await redisClient.get(`cacheHotels:${id}`)
    if(cache) {
      return JSON.parse(cache)
    } else {
      uncacheIds.push(id)
    }
  }))

  data = data.filter((item) => item)

  if(uncacheIds.length == 0) {
    return data
  }
  const hotelInformation = await redhawkHelper.getHotelInformationUsingIds(uncacheIds)
  let infos= convertRawResponseToLocal(hotelInformation)
  if(infos.length>0) {
    await Promise.all(infos.map(async (item:any) => {
      const exist = await redisClient.exists(`cacheHotels:${item.id}`)
      if(!exist) {
        await redisClient.set(`cacheHotels:${item.id}`,JSON.stringify(item))
      }
    }))
  }
  infos =[...data,...infos]
  await RedisHelper.redisSet('hotels', infos, {ids}, 60 * 6);
  return infos
}


const savedCacheData = async (data:any[],lat: number,lng: number) => {
  await RedisHelper.redisGeoAdd('hotels:geo','cacheHotels',data,{longitude:lng,latitude:lat})

}


const getDataFromCacheGeoCode = async (lat: number,lng: number) => {
  const data = await RedisHelper.redisGeoSearch('hotels:geo',lng,lat,10000)
  return data
}

const getPriceWithCharge = (price: number) => {
  const chargePercent = 10; // Example: 10% charge
  const finalPrice = price + (price * chargePercent) / 100;
  return {
    price: finalPrice,
    charge: (finalPrice - price).toFixed(2),
  };
}



export const HotelHelper = {
    mapHotelToCard,
    convertRawResponseToLocal,
    formatHotelName,
    formatHotelToAppJson,
    getBulkHotelsInfos,
    savedCacheData,
    getDataFromCacheGeoCode,
    getPriceWithCharge
}