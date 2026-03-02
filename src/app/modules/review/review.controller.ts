import { Request, Response, NextFunction } from 'express';
import { ReviewServices } from './review.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';

const createReview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    req.body.user = (req.user as any).id;
    const result = await ReviewServices.createReview(req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Review created successfully',
        data: result,
    });
})

const getAllReviews = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await ReviewServices.getAllReviews(req.query);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Reviews fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})

export const ReviewController = {
    createReview,
    getAllReviews
};
