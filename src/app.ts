import 'reflect-metadata';
import createError from 'http-errors';
import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';
import expressip from 'express-ip';

dotenv.config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : null,
});

import routerInit from './routes';

// database initialisation
// import "./database/connection";

const app: Express = express();

// middleware initialisation
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// 引入cookie-session
app.set('trust proxy', 1);
app.use(
  cookieSession({
    name: 'CAS_TGC',
    keys: ['JeCGbh2H96WZnN7N'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }),
);
app.use(expressip().getIpInfoMiddleware);

// router initialisation
routerInit(app);

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404, 'NOT FOUND!!!'));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json({
    code: -1,
    ...err,
  });
});

module.exports = app;
