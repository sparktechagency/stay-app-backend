import express from 'express';
import { ReviewController } from './review.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidations } from './review.validation';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.route('/')
    .post(auth(),validateRequest(ReviewValidations.createReviewZodSchema),ReviewController.createReview)
    .get(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),ReviewController.getAllReviews) 

export const ReviewRoutes = router;
