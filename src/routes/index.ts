import express, { Express, Request, Response, NextFunction, Router, RequestHandler } from 'express';
import USER from './user';
import Application from './application';
import { Index } from '../controller';

// index path: / method: GET
const router = express.Router();
router.get('/', Index);

/* routes */
type routeList = {
  [key: string]: Array<Router | RequestHandler>;
};

const routeList: routeList = {
  '/': [router],
  '/user': [USER],
  '/application': [Application],
};

export default (app: Express) => {
  Object.keys(routeList).forEach((path) => {
    app.use(path, ...routeList[path]);
  });
};
