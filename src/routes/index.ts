import express, { Express, Request, Response, NextFunction, Router, RequestHandler } from 'express';
import USER from './user';
import Application from './application';

const router = express.Router();

// /* routes */
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
