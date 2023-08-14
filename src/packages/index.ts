import type { NextFunction, Request, RequestHandler, Response } from 'express';

type optionTypes = {
  name: string; // application name
  token: string; // application token
  domain: string; // cas server domain
  apiPath: {
    // cas api path
    validate: string;
  };
  ignore: string[]; // client ignore api path
};

export default class Cas {
  constructor(option: optionTypes) {}

  static core(req: Request, res: Response, next: NextFunction) {
    console.log('=> cas core!');
  }

  static logout() {
    console.log('=> log out!');
  }
}
