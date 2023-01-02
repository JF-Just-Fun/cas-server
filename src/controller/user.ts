import type { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { has } from 'lodash';
import { dataSource, redis } from '../database';
import { LoginLog, User, Application } from '../models';
import { encryption, valid, getuuid, validate, success, fail, getST, cipher, decipher, cryptoHASH } from '../util';
import enums from '../enums';

/**
 * index
 * @returns '/user'
 */
export const index = (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  res.send('/user');
  return;
};

/**
 * 用户注册
 * @param req.body.name string
 * @param req.body.password string
 * @param req.body.email string
 * @param req.body.phone string
 * @param req.body.avatar string
 * @method POST
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, password, email, phone, avatar, code, result } = validate(
    {
      name: { type: 'string', required: true },
      password: { type: 'string', required: true },
      email: { type: 'string', required: true },
      phone: { type: 'string', required: false },
      avatar: { type: 'string', required: false },
    },
    req.body,
  );
  // 参数校验
  if (code) {
    fail(res, 22, `参数校验错误`, result);
    return;
  }
  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: [{ email }] });
  console.log(user);

  // user repeated
  if (user) {
    res.status(403).json({
      code: 100,
      msg: `${name} exited!`,
    });
    return;
  }

  await repository.insert({
    name,
    password: encryption(password),
    email,
    phone,
    avatar,
    account_id: getuuid(),
  });

  success(res, `${name} register success`);
  return;
};

/**
 * 账号密码登录
 * @param req.body.name string
 * @param req.body.password string
 * @method POST
 */
export const login = async (req: any, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { email, password, fromUrl, code, result } = validate(
    {
      email: { type: 'string', required: true },
      password: { type: 'string', required: true },
      fromUrl: { type: 'string', from: req.query, validation: valid['isUrl'] },
    },
    req.body,
  );

  // 参数校验
  if (code) {
    fail(res, 22, `参数校验错误`, result);
    return;
  }

  // todo: code to login and register
  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: [{ email, password: encryption(password) }] });

  if (!user) {
    fail(res, 21, '用户不存在', {});
    return;
  }

  // 密码校验
  if (encryption(password) !== user.password) {
    fail(res, enums.returnCode.密码错误, '密码错误', {});
    return;
  }

  // 用户状态校验
  if (!user.active) {
    fail(res, 23, '该用户已禁用', {});
    return;
  }
  req.session.userinfo = {
    name: user.name,
    email: user.email,
    account_id: user.account_id,
    avatar: user.avatar,
    manager: user.manager,
    timestamp: Date.now(),
  };

  // 生成TGT
  const TGT = cipher(req.session.userinfo);

  // 生成TGC
  const TGC = cryptoHASH(TGT);

  res.cookie('CAS_TGC', TGC, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });

  redis.setex(`TGC:${TGC}`, 365 * 24 * 60 * 60, TGT);

  // cas client admin
  if (!fromUrl) {
    success(res, '成功', req.session.userinfo);
    return;
  }

  // 生成ST
  const ST = await getST();

  res.redirect(301, `${fromUrl}?ST=${ST}`);
  return;
};

/**
 * 检查是否有登录cas
 * @param req.body.name string
 * @param req.body.password string
 * @method POST
 */
export const checkST = async (req: any, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { fromUrl, ST, token, code, result } = validate(
    {
      fromUrl: { type: 'string', required: true, validation: valid['isUrl'] },
      ST: { type: 'string', required: false },
    },
    req.body,
  );

  // 参数校验
  if (code) {
    fail(res, 22, `参数校验错误`, result);
    return;
  }
  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: [{ domain: fromUrl }] });
  if (!appInfo) {
    fail(res, 30, `认证失败,域名未授权`, {});
    return;
  }

  // 查询ip是否在白名单内
  const ip = '114.114.114.114' || req.ipInfo.ip;
  if (!appInfo.ip.split(',').includes(ip)) {
    fail(res, 31, `认证失败,ip未授权`, {});
    return;
  }
  if (!req.session.userinfo) {
    fail(res, 32, `认证失败,未登录cas`, {});
    return;
  }
  if (!req.session.userinfo[`${fromUrl}_ST`] || !ST || ST !== req.session.userinfo.ST) {
    // 生成ST
    const ST = await getST();
    req.session.userinfo[`${fromUrl}_ST`] = ST;
    console.log(ST);

    fail(res, 32, `认证失败,没有对应的ST，ST已重置，请用新的ST请求`, { ST });
    return;
  }
  // 提示认证成功
  req.session.userinfo[`${fromUrl}_ST`] = null;
  success(res);
  return;
};

/**
 * 获取用户简介，验证用户是否登录
 * @method GET
 */
export const profile = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { CAS_TGC } = req.cookies;

  if (!CAS_TGC) {
    fail(res, 401, 'cookie为空，请先登录！');
    return;
  }

  const TGT = await redis.get(`TGC:${CAS_TGC}`);

  if (!TGT) {
    fail(res, 401, 'cookie无效，请重新登录！');
    return;
  }

  const profile = decipher(TGT);

  success(res, 'success', profile);
  return;
};
