import { Request, Response, NextFunction } from 'express';
import { BookingServices } from './booking.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';

const getAllBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await BookingServices.getAllBookings(req.query,(req.user as any));
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Bookings fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})

const getBookingById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
    const result = await BookingServices.getBookingById(req.params.id,(req.user as any));
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Booking fetched successfully',
        data: result
    });
}
)

const cancelBooking = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
    const result = await BookingServices.cancelBooking(req.params.id,(req.user as any));
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Booking cancelled successfully',
        data: result
    });
} 

)


const checkInCheckoutHotel = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
    const result = await BookingServices.checkInCheckoutHotel(req.params.id,req.body.status);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Booking cancelled successfully',
        data: result
    });
})

export const BookingController = {
    getAllBookings,
    getBookingById,
    cancelBooking,
    checkInCheckoutHotel
};
