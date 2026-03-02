import ApiError from '../../../errors/ApiError';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import QueryBuilder from '../../builder/QueryBuilder';
import { Booking } from '../booking/booking.model';
import { INotification } from '../notification/notification.interface';
import { User } from '../user/user.model';
import { IReview, ReviewModel } from './review.interface';
import { Review } from './review.model';

const createReview = async (data: IReview) => {
    const existReview = await Review.findOne({ user: data.user, booking: data.booking });
    if (existReview) {
        throw new ApiError(400, 'You have already given a review for this booking');
    }
    const userDetails = await User.findOne({ _id: data.user });
    const booking = await Booking.findOne({ _id: data.booking });
    if(!booking) {
        throw new ApiError(404,'Booking not found')
    }

    if(['Cancelled','Completed','Pending'].includes(booking.status)) {
        if(booking.status =="Pending"){
            throw new ApiError(400,'Booking is still pending')
        }
        throw new ApiError(400,'Booking is already cancelled or completed')
    }
    const review = await Review.create({
        ...data,
        hotelId: booking.hotel_id
    });

    kafkaProducer.sendMessage('utils', {
        type:"notification",
        data:{
            receiver:[data.user],
            title:"New Review!!",
            message:`${userDetails?.name} has given a new review for ${data.hotelId} hotel`,
            isRead:false,
            filePath:"review",
            referenceId:review._id
        } 
    })
    return review;
};


const getAllReviews = async (query:Record<string,any>) => {
  const ReviewQuery = new QueryBuilder(Review.find({}), query).paginate().sort()

  const [reviews,pagination] = await Promise.all([
    ReviewQuery.modelQuery.populate("user",'name email profile address phone').exec(),
    ReviewQuery.getPaginationInfo()
  ])

  return {
    data:reviews,
    pagination
  }
}


export const ReviewServices = {
  createReview,
  getAllReviews
};
