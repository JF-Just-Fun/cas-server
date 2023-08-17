import express, { Express, Router, RequestHandler } from 'express';
import { Index } from '../controller';
import USER from './user';
import Application from './application';
import Ticket from './ticket';

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
  '/ticket': [Ticket],
};

export default (app: Express) => {
  Object.keys(routeList).forEach((path) => {
    app.use(path, ...routeList[path]);
  });
};
