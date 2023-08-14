import type { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { dataSource, redis } from '../database';
import { LoginLog, User, Application } from '../models';
import { encryption, valid, validate, success, fail, cipher, decipher, getUniCode } from '../util';
import { resCode, expires } from '../enums';

// todo 根据指定的unId查询用户信息，限定管理员可操作

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
  const { name, password, email, phone, avatar, result } = validate(
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
  if (result.length) {
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
    unId: getUniCode(),
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
  const { email, password, result } = validate(
    {
      email: { type: 'string', required: true },
      password: { type: 'string', required: true },
    },
    req.body,
  );

  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.INVALID, message: '参数校验错误', data: result });
    return;
  }

  // 清除之前的TGT
  const { CAS_TGC } = req.cookies;
  redis.del(`TGC:${CAS_TGC}`);

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
  if (!user.common.isActive) {
    fail(res, { code: resCode.DISABLED, message: '该用户已禁用' });
    return;
  }

  const userInfo = {
    name: user.name,
    email: user.email,
    unId: user.unId,
    avatar: user.avatar,
    manager: user.manager,
    time: Date.now(),
  };

  // 生成TGT
  const TGT = cipher(userInfo);

  // 生成TGC
  const TGC = getUniCode();

  res.cookie('CAS_TGC', TGC, { maxAge: expires.TGC_EXPIRE * 1000, httpOnly: true });

  redis.setex(`TGC:${TGC}`, expires.TGC_EXPIRE, TGT);

  success(res, { data: userInfo });
  return;
};

/**
 * 获取用户简介，验证用户是否登录
 * 如果用户存在TGT，则刷新过期TGT时间
 * @method GET
 */
export const profile = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { CAS_TGC } = req.cookies;

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

  res.clearCookie('CAS_TGC');

  const TGT = await redis.getex(`TGC:${CAS_TGC}`, 'EX', expires.TGC_EXPIRE);

  if (!TGT) {
    success(res, { code: resCode.REFUSE, data: 'cookie无效！' });
    return;
  }
  const profile = decipher(TGT);

  redis.del(`TGC:${CAS_TGC}`);

  success(res, { message: `用户<${profile.name}>登出成功！` });
  return;
};

/**
 * 校验ST凭证，ST的生成与用户和app相关，如果校验对不上则失效
 * @param req.body.name string
 * @param req.body.password string
 * @method POST
 */
export const checkST = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { token, ST, domain, result } = validate(
    {
      token: { type: 'string', required: true },
      ST: { type: 'string', required: true },
      domain: { type: 'string', required: true, validation: valid.isUrl },
    },
    req.body,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.INVALID, message: '参数校验错误', data: result });
    return;
  }

  const { CAS_TGC } = req.cookies;
  const currentTGT = await redis.getex(`TGC:${CAS_TGC}`, 'EX', expires.TGC_EXPIRE);

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: [{ token, domain }] });
  if (!appInfo) {
    fail(res, { code: resCode.REFUSE, message: '认证失败，应用未授权' });
    return;
  }

  const { TGT: targetTGT, token: targetToken } = await redis.hgetall(`ST:${ST}`);
  redis.del(`ST:${ST}`);

  const targetApp = await repository.findOne({ where: { token: targetToken } });

  if (!targetApp) {
    fail(res, { code: resCode.REFUSE, message: `目标应用${targetApp.domain}未注册！` });
    return;
  }

  if (!targetTGT || targetTGT !== currentTGT || targetApp.token !== token) {
    fail(res, { code: resCode.REFUSE, message: 'ST认证失败，请重新授权！' });
    return;
  }

  const userInfo = decipher(currentTGT);

  // 提示认证成功
  success(res, { message: 'ST验证成功！', data: userInfo });
  return;
};

/**
 * 授予 ST
 * @param {url} domain req.query.domain
 * @method POST
 */
export const getST = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { CAS_TGC } = req.cookies;
  const { domain, result } = validate(
    {
      domain: { type: 'string', required: true, validation: valid.isUrl },
    },
    req.query,
  );

  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.INVALID, message: '参数校验错误', data: result });
    return;
  }

  const TGT = await redis.getex(`TGC:${CAS_TGC}`, 'EX', expires.TGC_EXPIRE);
  if (!TGT) {
    fail(res, { code: resCode.REFUSE, message: '登录校验失败，请先登录！' });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: { domain } });

  if (!appInfo) {
    fail(res, { code: resCode.REFUSE, message: `应用${domain}未注册！` });
    return;
  }

  const STData = {
    TGT,
    token: appInfo.token,
  };

  // 生成ST
  const ST = getUniCode(12);
  redis.hset(`ST:${ST}`, STData);
  redis.expire(`ST:${ST}`, expires.ST_EXPIRE);
  console.log('=> redirect url: ', `${domain}?ST=${ST}`);

  res.redirect(301, `${domain}?ST=${ST}`);
  return;
};
