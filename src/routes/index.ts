import express, { Express, Request, Response, NextFunction, Router, RequestHandler } from 'express';
import USER from './user';
import Application from './application';
// import Issue from './issue';
// import Comment from './comment';
// import { authenticate } from '../middleware';

const router = express.Router();

// /* routes */
type routeList = {
  [key: string]: Array<Router | RequestHandler>;
};
const routeList: routeList = {
  '/': [router],
  '/user': [USER],
  '/application': [Application],
  // '/project': [authenticate, Project],
  // '/issue': [authenticate, Issue],
  // '/comment': [authenticate, Comment],
};

// /* GET home page. */
// router.get('/', function (req: Request, res: Response, next: NextFunction) {
//   res.send('<h1>hello express!</h1>');
// });
// router.post('/', function (req: Request, res: Response, next: NextFunction) {
//   res.json({
//     message: 'hello express!',
//     ip: req.ip,
//     ips: req.ips,
//   });
// });

export default (app: Express) => {
  Object.keys(routeList).forEach((path) => {
    app.use(path, ...routeList[path]);
  });
};
