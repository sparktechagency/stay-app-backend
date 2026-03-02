import { Request, Response, NextFunction } from 'express';
import { HotelServices } from './hotel.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const searchHotelsUsingGeoCode = catchAsync(async (req: Request, res: Response) => {
    const data = req.body;
    const result = await HotelServices.searchHotelsUsingGeoCode(data, req.user,{page:data?.page as any||1, limit: data?.limit as any||3});
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hotels fetched successfully',
        data: result,
    });
})


const getHotelInformationUsingId = catchAsync(async (req: Request, res: Response) => {

    const result = await HotelServices.getHotelInformationUsingId(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hotels fetched successfully',
        data: result,
    });
})


const getAutoComplete = catchAsync(async (req: Request, res: Response) => {

    const result = await HotelServices.hotelAutoCompleteResponse(req.query.searchTerm as string);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hotels fetched successfully',
        data: result,
    });
})


const getHotelRatesResponse = catchAsync(async (req: Request, res: Response) => {

    const result = await HotelServices.getHotelRatesResponse(req.body, req.user);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hotels fetched successfully',
        data: result,
    });
})


const chackRealPriceBeforeBook = catchAsync(async (req: Request, res: Response) => {
    const result = await HotelServices.getRealtimePriceFromPrebook(req.query.book_hash as string, req.query.booking_id as string);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hotels fetched successfully',
        data: result,
    })
})


const startTheBookingProcess = catchAsync(async (req: Request, res: Response) => {
    const result = await HotelServices.startTheBookingProcess(req.body, req.user);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hotels fetched successfully',
        data: result,
    })
})

export const HotelController = {
    searchHotelsUsingGeoCode,
    getHotelInformationUsingId,
    getAutoComplete,
    getHotelRatesResponse,
    chackRealPriceBeforeBook,
    startTheBookingProcess
};
