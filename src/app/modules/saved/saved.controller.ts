import { Request, Response, NextFunction } from 'express';
import { SavedServices } from './saved.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';

const savedHotelInfoInDB = catchAsync(async (req: Request, res: Response) => {
    req.body.userId = (req.user as any).id;
    await kafkaProducer.sendMessage('user',{
        type: 'saved',
        data: req.body
    })
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hotels fetched successfully',
        data:req.body,
    });
})


const getSavedHotels = catchAsync(async (req: Request, res: Response) => {
    const result = await SavedServices.savedHotelsFromDB(req.user, req.query);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hotels fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


export const SavedController = {
    savedHotelInfoInDB,
    getSavedHotels
};
