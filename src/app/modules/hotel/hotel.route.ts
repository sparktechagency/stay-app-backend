import express from 'express';
import { HotelController } from './hotel.controller';
import validateRequest from '../../middlewares/validateRequest';
import { HotelValidations } from './hotel.validation';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import tempAuth from '../../middlewares/tempAuth';

const router = express.Router();

router.route('/search/geo-code')
    .post(tempAuth(),validateRequest(HotelValidations.searchHotelsUsingGeoCodeZodSchema), HotelController.searchHotelsUsingGeoCode)
router.route('/autocomplete')
    .get(validateRequest(HotelValidations.searchHotelsAutoCompleteZodSchema),HotelController.getAutoComplete)
router.route('/info/:id')
    .get(HotelController.getHotelInformationUsingId)
router.get("/prebook",auth(USER_ROLES.USER),validateRequest(HotelValidations.preBookPriceZodSchema),HotelController.chackRealPriceBeforeBook)
router.route('/rates')
    .post(auth(USER_ROLES.USER),validateRequest(HotelValidations.getHotelRatesZodSchema),HotelController.getHotelRatesResponse)
router.post("/start-booking",auth(USER_ROLES.USER),validateRequest(HotelValidations.startTheBookingProcessZodSchema),HotelController.startTheBookingProcess)
export const HotelRoutes = router;
