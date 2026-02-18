import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { HotelRoutes } from '../app/modules/hotel/hotel.route';
import { PackageRoutes } from '../app/modules/package/package.route';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route';
import { SavedRoutes } from '../app/modules/saved/saved.route';
import { DisclaimerRoutes } from '../app/modules/disclaimer/disclaimer.route';
import { FaqRoutes } from '../app/modules/faq/faq.route';
const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path:"/hotel",
    route:HotelRoutes
  },
  {
    path:"/package",
    route:PackageRoutes
  },
  {
    path:"/subscription",
    route:SubscriptionRoutes
  },
  {
    path:"/saved",
    route:SavedRoutes
  },
  {
    path:"/disclaimer",
    route:DisclaimerRoutes
  },
  {
    path:"/faq",
    route:FaqRoutes
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
