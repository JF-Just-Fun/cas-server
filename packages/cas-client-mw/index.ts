import express from 'express';
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import axios from 'axios';
import session from 'express-session';

type apiMapType = {
  login: string;
  logout: string;
  profile: string;
};

type casApiType = {
  validate: string;
};

type optionTypes = {
  token: string; // application token
  domain: string; // cas server domain
  ignore: string[]; // client ignore api path
  apiMap: apiMapType; // client ignore api path
};

export default class Cas {
  static loginPage: string = 'https://yinpo.space/cas'; // CAS login page url
  static serviceUrl: string = 'https://api.yinpo.space/cas'; // CAS service base url
  static prefixPath: string = '/cas-server';
  static casApi: casApiType = {
    validate: '/user/st',
  };

  private name: string; // current client name
  private token: string = '';
  private domain: string = '';
  private router: Router;
  private apiMap: apiMapType = {
    login: '/login',
    logout: '/logout',
    profile: '/profile',
  };

  constructor(option: optionTypes) {
    this.token = option.token;
    this.domain = option.domain;
    this.router = express.Router();
    Object.assign(this.apiMap, option.apiMap);

    // 载入session
    this.router.use(
      session({
        secret: 'yinpo-cas-client-session-secret-key',
        resave: false,
        saveUninitialized: true,
        cookie: {
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      }),
    );
  }

  core() {
    this.router.get(this.apiMap.login, this.checkST);

    this.router.get(this.apiMap.logout, this.logout);

    this.router.get(this.apiMap.profile, this.profile);

    return this.router;
  }

  private checkST = async (req: Request, res: Response, next: NextFunction) => {
    const { ST } = req.query;
    const response = await axios.post(Cas.serviceUrl + '/ticket/st', { ST, token: this.token, domain: this.domain });

    if (response.data.code !== 0) {
      res.redirect(Cas.loginPage);
      return;
    }

    req.session.user = response.data.data;

    res.status(200).json(response.data.data);
  };

  private logout = async (req: Request, res: Response, next: NextFunction) => {
    req.session.user = null;
    res.status(200).json({ data: '退出成功！' });
  };

  private profile = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      res.status(401).json({ message: '未登录！' });
      return;
    }
    res.status(200).json({ data: req.session.user });
  };
}
