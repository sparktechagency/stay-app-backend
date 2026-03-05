import config from '../config';

class GoogleMapHelper {
  private api_key: string = config.google.map_api_key!;
  public async getAddressUsingGeoCode(
    lat: number,
    lng: number,
  ): Promise<{
    country: {
        long_name: string
        short_name: string
    };
    city: string;
    formated_address: string;
  }> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.api_key}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data?.results == 'ZERO_RESULTS') {
        return { country: {
            long_name: '',
            short_name: ''
        }, city: '', formated_address: '' };
      }
      
      const country = data.results?.find((result: any) =>
        result.types.includes('country'),
    );
    console.log(country);

      const city = data.results?.find((result: any) =>
        result.types.includes('locality'),
      );

      if (!country || !city) {
        return { country: {
            long_name: '',
            short_name: ''
        }, city: '', formated_address: '' };
      }
      return {
        country:{
            long_name: country?.address_components?.[0]?.long_name,
            short_name: country?.address_components?.[0]?.short_name
        },
        city: city.formatted_address,
        formated_address: data.results[0].formatted_address,
      };
    } catch (error) {
        console.log(error);
        
      return { country: {} as any, city: '', formated_address: '' };
    }
  }

  async getAddressInfoUsingAddress(address: string):Promise<{
    country: {
        long_name: string
        short_name: string
    };
    city: string;
    formated_address: string;
  }> {
    const geoCode = await this.getGeoCodeUsingAddress(address);
    return this.getAddressUsingGeoCode(geoCode.lat, geoCode.lng);
  }

  async getGeoCodeUsingAddress(address: string) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${this.api_key}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data?.results == 'ZERO_RESULTS') {
        return { lat: 0, lng: 0 };
      }
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      };
    } catch (error) {
        console.log(error);
        
      return { lat: 0, lng: 0 };
    }
  }
}

export const googleMapHelper = new GoogleMapHelper();
