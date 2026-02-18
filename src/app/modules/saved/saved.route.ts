import express from 'express';
import { SavedController } from './saved.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { SavedValidations } from './saved.validation';

const router = express.Router();

router.route('/')
    .post(auth(),validateRequest(SavedValidations.savedHotelInfoInDBZodSchema),SavedController.savedHotelInfoInDB)
    .get(auth(),SavedController.getSavedHotels)

export const SavedRoutes = router;
