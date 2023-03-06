import { NextFunction, Request, RequestHandler, Response } from 'express';

export const Index = (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  res.send('<h1>hello cas server</h1>');
  return;
};

export * as UserController from './user';
export * as ApplicationController from './application';
