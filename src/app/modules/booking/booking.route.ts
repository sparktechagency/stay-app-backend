import express from 'express';
import { BookingController } from './booking.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { BookingValidations } from './booking.validation';

const router = express.Router();

router.route('/')
    .get(auth(USER_ROLES.USER), BookingController.getAllBookings)

router.patch('/check-in-out/:id', auth(USER_ROLES.USER),validateRequest(BookingValidations.checkinCheckoutZodSchema), BookingController.checkInCheckoutHotel)

router.route('/:id')
    .get(auth(USER_ROLES.USER), BookingController.getBookingById)
    .post(auth(USER_ROLES.USER), BookingController.cancelBooking)
export const BookingRoutes = router;
