import { redisClient } from '../../../config/redis';
import { imageFormatHelper } from '../../../helpers/imageFormatHelper';
import { redhawkHelper } from '../../../helpers/redhawkHelper';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import {
  IHotel,
  HotelSearchResponse,
  Rate,
} from '../../../types/redhawk/getHotelsUsingGeoCode';
import {
  HotelData,
  HotelDetailOutput,
  MetapolicyStruct,
} from '../../../types/redhawk/hotelInformation';
import { Saved } from '../saved/saved.model';

export async function mapHotelToCard(
  hotel: IHotel,
  options?: {
    hotelName?: string;
    location?: string;
    rating?: number;
    image?: string;
    discountPercent?: number;
  },
  user?: { id: string },
) {
  const existData = await redisClient.get(`cacheHotels:${hotel.id}`);
  if(existData) {
    const data = JSON.parse(existData);
    const [isFevorite, isSaved] = await Promise.all([
      Saved.isFevorite(hotel?.id!, user?.id!, 'favorite'),
      Saved.isFevorite(hotel?.id!, user?.id!, 'saved'),
    ])

    return {
      ...data,
      isFevorite,
      isSaved
    }
  }
  const rates: Rate[] = hotel.rates || [];
  const hotelDetails = await redhawkHelper.getHotelInformationUsingId(hotel.id);
  const info = formatHotelToAppJson(hotelDetails);
  if (!rates.length) return null;

  // find cheapest rate
  const cheapestRate = rates.reduce((prev, curr) => {
    const prevPrice = Math.min(...prev.daily_prices.map(Number));
    const currPrice = Math.min(...curr.daily_prices.map(Number));
    return currPrice < prevPrice ? curr : prev;
  });

  const pricePerNight = Math.min(...cheapestRate.daily_prices.map(Number));

  const discount = options?.discountPercent ?? 20;

  const originalPrice = Math.round(pricePerNight / (1 - discount / 100));

  const payment = cheapestRate.payment_options?.payment_types?.[0];
  const [isFevorite, isSaved] = await Promise.all([
    Saved.isFevorite(hotel?.id!, user?.id!, 'favorite'),
    Saved.isFevorite(hotel?.id!, user?.id!, 'saved'),
  ]);

  const data = {
    id: hotel.id,
    hid: hotel.hid,

    name: info.hotel.name,
    location: info.hotel.location.address,
    meal: cheapestRate.meal,
    rating: info.hotel.rating,

    image: imageFormatHelper([info.images?.main || ''])[0],

    roomType: cheapestRate.room_name,

    discountPercent: discount,

    originalPrice,
    pricePerNight,

    currency: payment?.currency_code ?? 'USD',
    isFevorite,
    isSaved,
  };

  const exist = await redisClient.exists(`cacheHotels:${data.id}`);
if(exist) return data
  const newData= {
    id: data.id,
    hid: data.hid,
    name: data.name,
    location: data.location,
    meal: data.meal,
    rating: data.rating,
    image: data.image,
    roomType: data.roomType,
    discountPercent: data.discountPercent,
    originalPrice: data.originalPrice,
    pricePerNight: data.pricePerNight,
    currency: data.currency,
  };

  await redisClient.set(`cacheHotels:${data.id}`, JSON.stringify(newData), 'EX', 60 * 60 * 24);

  return data;
}

function formatHotelName(slug: string): string {
  return slug
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const convertRawResponseToLocal = async (
  response: HotelSearchResponse['data']['hotels'],
  user?: any,
) => {
  return Promise.all(response?.map(hotel => mapHotelToCard(hotel, undefined, user)) || []);
};

function formatHotelToAppJson(hotel: HotelData): HotelDetailOutput {
  // Extract key fields (adjust property names if your JSON uses different keys)
  const name = hotel.name || 'Unnamed Hotel';
  const rating = hotel.star_rating || 0;
  const address = hotel.address || '';
  const city = hotel.region?.name || '';
  const postalCode = hotel.postal_code || '';
  const countryCode = hotel.region?.country_code || '';

  // Main description - prefer "Rooms" or first meaningful paragraph
  let description = '';
  if (hotel.description_struct) {
    const roomSection = hotel.description_struct.find(
      (s: any) => s.title === 'Rooms' || s.title.includes('room'),
    );
    if (roomSection && roomSection.paragraphs?.length) {
      description = roomSection.paragraphs.join('\n\n');
    } else if (hotel.description_struct[0]?.paragraphs?.length) {
      description = hotel.description_struct[0].paragraphs.join('\n\n');
    }
  }

  // Simple notes / special info
  const notes: string[] = [];
  if (hotel.policy_struct) {
    hotel.policy_struct.forEach((p: any) => {
      if (p.title === 'Extra info' || p.title === 'Special living conditions') {
        p.paragraphs.forEach((para: string) => notes.push(para));
      }
    });
  }

  // Grouped amenities (similar to your screenshot style)
  const amenityCategories: Record<string, Set<string>> = {};
  let amenitiesList: string[] = [];
  if (hotel.amenity_groups) {
    hotel.amenity_groups.forEach((group: any) => {
      const cat = group.group_name;
      if (!amenityCategories[cat]) {
        amenityCategories[cat] = new Set();
      }
      group.amenities.forEach((item: string) => {
        amenityCategories[cat].add(item);
        amenitiesList.push(item);
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
  const checkIn = hotel.check_in_time?.substring(0, 5) || 'Flexible';
  const checkOut = hotel.check_out_time?.substring(0, 5) || 'Flexible';

  // Map link
  const lat = hotel.latitude || 0;
  const lng = hotel.longitude || 0;
  const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';

  // Pricing placeholder (your original JSON didn't have real price)
  const pricing = {
    total: null,
    currency: 'USD',
    nights: 2,
    date_range: 'example dates',
  };

  // Images (first few from the array)
  const images = hotel.images || [];
  const outputImages =
    images.length > 0
      ? {
          main: imageFormatHelper([images[0] || ''])[0],
          gallery: imageFormatHelper(images).slice(0, 5),
        }
      : undefined;

  return {
    hotel: {
      id: hotel.id,
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
      description: description.trim() || 'No description available',
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
    all_amenities: amenitiesList,
    meta_policy:formatMetaPolicy(hotel.metapolicy_struct),
    extra_meta_policy:hotel.metapolicy_extra_info
  };
}

async function getBulkHotelsInfos(ids: string[]) {
  const cache = await RedisHelper.redisGet('hotels', { ids });
  if (cache) return cache;
  let uncacheIds: string[] = [];
  let data = await Promise.all(
    ids.map(async id => {
      const cache = await redisClient.get(`cacheHotels:${id}`);
      if (cache) {
        return JSON.parse(cache);
      } else {
        uncacheIds.push(id);
      }
    }),
  );

  data = data.filter(item => item);

  if (uncacheIds.length == 0) {
    return data;
  }
  const hotelInformation =
    await redhawkHelper.getHotelInformationUsingIds(uncacheIds);
  let infos = await convertRawResponseToLocal(hotelInformation);
  if (infos.length > 0) {
    await Promise.all(
      infos.map(async (item: any) => {
        const exist = await redisClient.exists(`cacheHotels:${item.id}`);
        if (!exist) {
          await redisClient.set(
            `cacheHotels:${item.id}`,
            JSON.stringify(item),
            'EX',
            60 * 60 * 24,
          );
        }
      }),
    );
  }
  infos = [...data, ...infos];
  await RedisHelper.redisSet('hotels', infos, { ids }, 60 * 6);
  return infos;
}

const savedCacheData = async (data: any[], lat: number, lng: number) => {
  await RedisHelper.redisGeoAdd('hotels:geo', 'cacheHotels', data, {
    longitude: lng,
    latitude: lat,
  });
};

const getDataFromCacheGeoCode = async (lat: number, lng: number) => {
  const data = await RedisHelper.redisGeoSearch('hotels:geo', lng, lat, 10000);
  return data;
};

const getPriceWithCharge = (price: number) => {
  const chargePercent = 10; // Example: 10% charge
  const finalPrice = price + (price * chargePercent) / 100;
  return {
    price: finalPrice,
    charge: (finalPrice - price).toFixed(2),
  };
};


function formatMetaPolicy(policy: MetapolicyStruct): string[] {
  const result: string[] = [];

  if (policy.children_meal.length) {
    policy.children_meal.forEach((item) => {
      result.push(
        `Children Meal (${item.meal_type}): ${item.inclusion === 'not_included' ? 'Not included' : `${item.price} ${item.currency}`}`
      );
    });
  }

  if (policy.deposit.length) {
    policy.deposit.forEach((item) => {
      result.push(`Deposit: ${item.price} ${item.currency} (${item.availability})`);
    });
  }

  if (policy.extra_bed.length) {
    policy.extra_bed.forEach((item) => {
      result.push(`Extra Bed: ${item.price} ${item.currency} (${item.inclusion === 'not_included' ? 'Not included' : 'Included'})`);
    });
  }

  if (policy.meal.length) {
    policy.meal.forEach((item) => {
      result.push(`Meal (${item.meal_type}): ${item.inclusion === 'not_included' ? 'Not included' : `${item.price} ${item.currency}`}`);
    });
  }

  if (policy.parking.length) {
    policy.parking.forEach((item) => {
      result.push(`Parking: ${item.price} ${item.currency} (${item.inclusion === 'not_included' ? 'Not included' : 'Included'})`);
    });
  }

  if (policy.pets.length) {
    policy.pets.forEach((item) => {
      result.push(`Pets: ${item.price} ${item.currency} (${item.inclusion === 'not_included' ? 'Not included' : 'Included'})`);
    });
  }

  if (policy.no_show.availability && policy.no_show.availability !== 'unspecified') {
    result.push(`No Show Policy: ${policy.no_show.availability}`);
  }

  if (policy.visa.visa_support && policy.visa.visa_support !== 'unspecified') {
    result.push(`Visa Support: ${policy.visa.visa_support}`);
  }

  return result;
}


export const HotelHelper = {
  mapHotelToCard,
  convertRawResponseToLocal,
  formatHotelName,
  formatHotelToAppJson,
  getBulkHotelsInfos,
  savedCacheData,
  getDataFromCacheGeoCode,
  getPriceWithCharge,
  formatMetaPolicy
};
