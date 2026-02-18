import { redisClient } from "../../config/redis";

const redisSet = async (key: string, value: any, query?: Record<string, any>, ttl: number=60) => {
  const queryString = new URLSearchParams(query as Record<string, string>).toString();
  
  
  await redisClient.set(`${key}:${queryString||'1'}`, JSON.stringify(value), "EX",ttl);
  return false;
};

const redisGet = async (key: string, query?: Record<string, any>) => {
  const queryString = new URLSearchParams(query as Record<string, string>).toString();
  const data = JSON.parse(await redisClient.get(`${key}:${queryString||'1'}`) || "[]");

  if (Array.isArray(data) && !data.length) {
    return null;
  }

  return data;
};

const redisHset = async (key: string, query: Record<string, any>, value: any, ttl: number=60) => {
  const field = new URLSearchParams(query as Record<string, string>).toString();
  await redisClient.hset(key, field, JSON.stringify(value), "EX",ttl);
};

const redisHget = async (key: string, query: Record<string, any>) => {
  const field = new URLSearchParams(query as Record<string, string>).toString();
  const data = JSON.parse(await redisClient.hget(key, field) || "[]");
  if (Array.isArray(data) && !data.length) {
    return null;
  }
  return data;
};

const keyDelete = async (pattern: string) => {
  const keys = await redisClient.scanStream({ match: pattern }).toArray();
  
  if (!keys?.flat().length) return;

  // Use pipeline for efficient deletion
  const pipeline = redisClient.multi();
  keys.forEach((key) =>{
    if(key.length) pipeline.del(key);
  });
  await pipeline.exec();
};

// ✅ Fixed HKeyDelete function
const HKeyDelete = async (key: string) => {
  const fields = await redisClient.hkeys(key);
  console.log('Fields to delete:', fields);
  
  if (!fields.length) return;

  await redisClient.hdel(key, ...fields);
};


const pushToRedis = async (key: string, value: any) => {
  await redisClient.lpush(key, JSON.stringify(value));
}

const popFromRedis = async (key: string) => {
  const data = await redisClient.lpop(key);
  return data ? JSON.parse(data) : null;
}

const getPaginatedData = async (key: string,query?: Record<string, any>) => {
  if(!query){
    // return all data
    const data = await redisClient.lrange(key, 0, -1);
    return data.map((item) => JSON.parse(item));
  }else{
     const limit = Number(query?.limit) || 10;
    const page = Number(query?.page) || 1;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const rawData = await redisClient.lrange(key, start, end);
    const data = rawData.map(item => JSON.parse(item));

    const total = await redisClient.llen(key);
    const totalPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        limit,
        page,
        totalPage,
      },
    };
  }
}

const redisGeoAdd = async (key: string, mamberKey:string,data:any[],options:{longitude:number,latitude:number}) => {
  const {longitude,latitude} = options;
  for(const item of data){
    const exist = await redisClient.exists(`${mamberKey}:${item.id}`);
    if(exist) continue;
    await redisClient.set(`${mamberKey}:${item.id}`,JSON.stringify(item),'EX',60*60*24);
    await redisClient.geoadd(key,longitude,latitude,`${mamberKey}:${item.id}`);
  }
}

const redisGeoSearch = async (key: string,longitude:number,latitude:number,radius:number) => {
  const data = await redisClient.georadius(key,longitude,latitude,radius,'km');
  const getData = await Promise.all(data.map(async (item:any) => {
    const data = await redisClient.get(item);
    return data ? JSON.parse(data) : null;
  }))

  return getData
}

export const RedisHelper = {
  redisSet,
  redisGet,
  redisHset,
  redisHget,
  keyDelete,
  HKeyDelete,
  pushToRedis,
  popFromRedis,
  getPaginatedData,
  redisGeoAdd,
  redisGeoSearch
};
