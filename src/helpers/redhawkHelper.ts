import axios from 'axios';
import config from '../config';
import {
  HotelSearchRequest,
  HotelSearchResponse,
} from '../types/redhawk/getHotelsUsingGeoCode';
import { HotelData } from '../types/redhawk/hotelInformation';
import { HotelAutoCompleteResponse } from '../types/redhawk/autocompleteHotel';
import { HotelRatesResponse } from '../types/redhawk/hotelHomePage';
import ApiError from '../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { PaymentRequest, StartBookingResponse } from '../types/redhawk/startBooking';

class RedhawkHelper {
  private user_id: string = config.redhawk.user_id!;
  private api_key: string = config.redhawk.api_key!;

  private async requestHandler(
    url: string,
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT',
    params?: Record<string, any>,
    data?: any,
  ) {
    try {
      if (params) {
        for (const key in params) {
          if (params[key] === undefined) {
            delete params[key];
          }
        }
      }

      return await axios({
        url: `${config.redhawk.url}${url}`,
        method: method,
        params: params,
        data: data,
        auth: {
          username: this.user_id,
          password: this.api_key,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  public async getHotelsByGeoCode(
    payload: HotelSearchRequest,
  ): Promise<HotelSearchResponse['data']> {
    const response = await this.requestHandler(
      '/api/b2b/v3/search/serp/geo',
      'POST',
      {},
      payload,
    );
  
    
    const data: HotelSearchResponse = response?.data || {};

    if (data.error) {
      throw new ApiError(StatusCodes.BAD_REQUEST, data.error as string);
    }
    
    return data?.data || { hotels: [], total_hotels: 0 };
  }

  public async getHotelInformationUsingId(
    hotel_id: string,
  ): Promise<HotelData> {
    const response = await this.requestHandler(
      `/api/b2b/v3/hotel/info`,
      'POST',
      {},
      { id: hotel_id, language: 'en' },
    );
    const data = response?.data || {};
    return data?.data;
  }

  async autoCompleteAddress(
    address: string,
  ): Promise<HotelAutoCompleteResponse['data']['hotels']> {
    const response = await this.requestHandler(
      `/api/b2b/v3/search/multicomplete`,
      'POST',
      {},
      { query: address, language: 'en' },
    );
    const data = response?.data || {};
    return data?.data?.hotels || [];
  }
  async getHotelInformationUsingIds(
    hotel_ids: string[],
  ): Promise<HotelSearchResponse['data']['hotels']> {
    try {
      const response = await this.requestHandler(
        `/api/b2b/v3/search/serp/hotels`,
        'POST',
        {},
        {
          checkin: new Date(new Date().setDate(new Date().getDate() + 1))
            .toISOString()
            .split('T')[0],
          checkout: new Date(new Date().setDate(new Date().getDate() + 3))
            .toISOString()
            .split('T')[0],
          language: 'en',
          guests: [{ adults: 1, children: [] }],
          ids: hotel_ids,
          currency: 'EUR',
        },
      );
      console.log(`ids`, hotel_ids);

      const data = response?.data || {};
      return data?.data?.hotels || [];
    } catch (error) {
      console.log(error);

      return [];
    }
  }

  async getHotelPage(
    payload: Partial<HotelSearchRequest>,
  ): Promise<HotelRatesResponse['data']['hotels']> {
    const response = await this.requestHandler(
      `/api/b2b/v3/search/hp`,
      'POST',
      {},
      payload,
    );
    const data = response?.data || {};
    return data?.data?.hotels || [];
  }

  async chackRealPriceBeforeBook(
    book_hash: string,
  ): Promise<HotelRatesResponse['data']> {
    const response = await this.requestHandler(
      `/api/b2b/v3/hotel/prebook`,
      'POST',
      {},
      { hash: book_hash },
    );
    const data = (response?.data || {}) as HotelRatesResponse;

    if (data.error) {
      throw new ApiError(StatusCodes.BAD_REQUEST, data.error);
    }

    return data?.data || {};
  }

  async startTheBookingProcess(booking_id: string, book_hash: string): Promise<StartBookingResponse["data"]> {
    const response = await this.requestHandler(
      `/api/b2b/v3/hotel/order/booking/form`,
      'POST',
      {},
      {
        partner_order_id: booking_id,
        book_hash: book_hash,
        language: 'en',
        user_ip: '82.29.0.86',
      },
    );

    const data = (response?.data || {}) as StartBookingResponse;
    
    if(data.error) {
      
      throw new ApiError(StatusCodes.BAD_REQUEST, data.error as string);
    }
    return data?.data || {};
  }

  async creditCardTokenizer(payload: PaymentRequest): Promise<any> {
    const response = await axios.post('https://api.payota.net/api/public/v1/manage/init_partners', payload);
    const data = (response?.data || {})
    console.log(data);
    
    if(data.status === 'error') {
      console.log(data);
      
      throw new ApiError(StatusCodes.BAD_REQUEST, data.error as string);
    }
    return data?.status || '';
  }
}

export const redhawkHelper = new RedhawkHelper();
