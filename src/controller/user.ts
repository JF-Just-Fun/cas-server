import type { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { has } from 'lodash';
import { dataSource, redis } from '../database';
import { LoginLog, User, Application } from '../models';
import { encryption, valid, getuuid, validate, success, fail, cipher, decipher, cryptoHASH } from '../util';
import { resCode, expires } from '../enums';

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
      email: { type: 'string', required: true, validation: valid.isEmail },
      phone: { type: 'string', required: false, validation: valid.isPhone },
      avatar: { type: 'string', required: false },
    },
    req.body,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.INVALID, message: '参数校验错误', data: result });
    return;
  }
  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: [{ email }, { phone }, { name }] });

  // user repeated
  if (user) {
    const message = [];
    if (user.name === name) message.push(`用户名:${name}已存在`);
    if (user.email === email) message.push(`邮箱:${email}已存在`);
    if (user.phone === phone) message.push(`手机号:${phone}已存在`);

    fail(res, { code: resCode.DISABLED, data: message.join(';') });
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

  success(res, { message: `${name} register success` });
  return;
};

/**
 * 账号密码登录
 * @param req.body.name string
 * @param req.body.password string
 * @method POST
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { email, password, fromUrl, code, result } = validate(
    {
      email: { type: 'string', required: true },
      password: { type: 'string', required: true },
      fromUrl: { type: 'string', from: req.query, validation: valid.isUrl },
    },
    req.body,
  );

  // 参数校验
  if (code) {
    fail(res, { code: resCode.INVALID, message: '参数校验错误', data: result });
    return;
  }

  // todo: SMS code to login and register
  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: [{ email, password: encryption(password) }] });

  if (!user) {
    fail(res, { code: resCode.MISTAKE, message: '用户不存在' });
    return;
  }

  // 密码校验
  if (encryption(password) !== user.password) {
    fail(res, { code: resCode.MISTAKE, message: '密码错误' });
    return;
  }

  // 用户状态校验
  if (!user.active) {
    fail(res, { code: resCode.DISABLED, message: '该用户已禁用' });
    return;
  }

  const userInfo = {
    name: user.name,
    email: user.email,
    account_id: user.account_id,
    avatar: user.avatar,
    manager: user.manager,
    timestamp: Date.now(),
  };

  // 生成TGT
  const TGT = cipher(userInfo);

  // 生成TGC
  const TGC = cryptoHASH(TGT);

  res.cookie('CAS_TGC', TGC, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });

  redis.setex(`TGC:${TGC}`, expires.TGC_EXPIRE, TGT);
  redis.lpush(`USER_TICKET:${userInfo.account_id}`, `TGC:${TGC}`);

  // cas client admin
  if (!fromUrl) {
    success(res, { data: userInfo });
    return;
  }

  // 生成ST
  const salt = Math.random().toString(36).substring(2);
  const ST = encryption(TGT, salt);
  redis.setex(`ST:${ST}`, expires.ST_EXPIRE, TGT);
  redis.lpush(`USER_TICKET:${userInfo.account_id}`, `ST:${ST}`);

  res.redirect(301, `${fromUrl}?ST=${ST}`);
  return;
};

/**
 * 检查是否有登录cas
 * @param req.body.name string
 * @param req.body.password string
 * @method POST
 */
export const checkST = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { applicationToken, ST, code, result } = validate(
    {
      applicationToken: { type: 'string', required: true },
      ST: { type: 'string', required: true },
    },
    req.body,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.INVALID, message: '参数校验错误', data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: [{ token: applicationToken }] });
  if (!appInfo) {
    fail(res, { code: resCode.REFUSE, message: '认证失败，应用未授权' });
    return;
  }

  const TGT = await redis.get(`ST:${ST}`);
  if (!TGT) {
    fail(res, { code: resCode.REFUSE, message: 'ST认证失败，请重新登录！' });
    return;
  }
  const profile = decipher(TGT);
  redis.del(`ST:${ST}`);

  // 提示认证成功
  success(res, { message: 'ST验证成功！', data: profile });
  return;
};

/**
 * 获取用户简介，验证用户是否登录
 * 如果用户存在TGT，则刷新过期TGT时间
 * @method GET
 */
export const profile = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { CAS_TGC } = req.cookies;

  if (!CAS_TGC) {
    fail(res, { code: resCode.REFUSE, message: 'cookie为空，请先登录！' });
    return;
  }

  const TGT = await redis.getex(`TGC:${CAS_TGC}`, 'EX', expires.TGC_EXPIRE);

  if (!TGT) {
    fail(res, { code: resCode.REFUSE, message: 'cookie无效，请重新登录！' });
    return;
  }

  const profile = decipher(TGT);

  success(res, { data: profile });
  return;
};

/**
 * 用户登出CAS
 * 销毁当前用户相关的ST TGT
 * @method DELETE
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { CAS_TGC } = req.cookies;

  if (!CAS_TGC) {
    fail(res, { code: resCode.REFUSE, message: '用户并未登陆，无需登出！' });
    return;
  }

  const TGT = await redis.getex(`TGC:${CAS_TGC}`, 'EX', expires.TGC_EXPIRE);

  if (!TGT) {
    fail(res, { code: resCode.REFUSE, data: 'cookie无效！' });
    return;
  }
  const profile = decipher(TGT);
  const ticketList = await redis.lrange(`USER_TICKET:${profile.account_id}`, 0, -1);

  for (let i = 0; i < ticketList.length; i++) {
    const ticket = ticketList[i];
    redis.del(ticket);
  }
  redis.del(`USER_TICKET:${profile.account_id}`);

  success(res, { message: `用户<${profile.name}>登出成功！` });
  return;
};
