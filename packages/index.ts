import type { NextFunction, Request, RequestHandler, Response } from 'express';
import axios from 'axios';

type optionTypes = {
  token: string; // application token
  domain: string; // cas server domain
  apiPath: {
    // cas api path
    validate: string;
  };
  ignore: string[]; // client ignore api path
};

type routeMapType = {
  login: string;
  logout: string;
  checkST: string;
  getProfile: string;
};

export default class Cas {
  static loginPage: string = 'https://yinpo.space/cas'; // CAS login page url

  private name: string; // current client name
  private serviceUrl: string = ''; // CAS service base url
  private routeMap: routeMapType = {
    // CAS service route path
    login: '',
    logout: '',
    checkST: '',
    getProfile: '',
  };
  private token: string = '';
  private domain: string = '';

  constructor(option: optionTypes) {
    this.token = option.token;
    this.domain = option.domain;
  }

  core(req: Request, res: Response, next: NextFunction) {
    console.log('=> cas core!');
  }

  async checkST(req: Request, res: Response, next: NextFunction) {
    const { ST } = req.query;
    const response = await axios.post(this.routeMap.checkST, { ST, token: this.token, domain: this.domain });

    if (response.data.code !== 0) {
      res.redirect(Cas.loginPage);
      return;
    }

    res.status(200).json(response.data.data);
  }

  logout() {
    console.log('=> log out!');
  }
}
