import type { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { dataSource, redis } from '../database';
import { Not } from 'typeorm';
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

  // todo: SMS code to login and register
  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: [{ email, password: encryption(password) }] });

  if (!user) {
    fail(res, { code: resCode.MISTAKE, message: '用户不存在' });
    return;
  }

  // 用户状态校验
  if (!user.common.isActive) {
    fail(res, { code: resCode.DISABLED, message: '该用户已禁用' });
    return;
  }

  const profile = {
    name: user.name,
    email: user.email,
    unId: user.unId,
    avatar: user.avatar,
    manager: user.manager,
    phone: user.phone,
    birth: user.birth,
    gender: user.gender,
  };

  res.locals.profile = profile;
  next();
};

/**
 * 获取用户简介，验证用户是否登录
 * 如果用户存在TGT，则刷新过期TGT时间
 * @method GET
 */
export const profile = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { CAS_TGC } = req.cookies;

  // 清除之前的TGT
  redis.del(`TGC:${CAS_TGC}`);
  const profile = res.locals.profile;

  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: { unId: profile.unId } });

  if (!user) {
    fail(res, { code: resCode.MISTAKE, message: '用户不存在' });
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
    phone: user.phone,
    birth: user.birth,
    gender: user.gender,
  };

  // 生成新的TGT
  const TGT = cipher(userInfo);

  // 生成新的TGC
  const TGC = getUniCode();

  res.cookie('CAS_TGC', TGC, { maxAge: expires.TGC_EXPIRE * 1000, httpOnly: true });

  redis.setex(`TGC:${TGC}`, expires.TGC_EXPIRE, TGT);

  success(res, { data: userInfo });
};

/**
 * 获取系统用户信息
 * @method GET
 */
export const query = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { page, size, result } = validate(
    {
      page: { type: 'number', default: 1 },
      size: { type: 'number', default: 20 },
    },
    req.query,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(User);
  const userList = await repository.findAndCount({
    take: size,
    skip: (page - 1) * size,
    where: { common: { isActive: true } },
  });

  const List = userList[0].reduce((res, item) => {
    delete item.common;
    res.push(item);
    return res;
  }, []);

  success(res, { data: List, count: userList[1] });
  return;
};

/**
 * 更新用户信息
 * @method GET
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { summary, result } = validate(
    {
      name: { type: 'string' },
      password: { type: 'string' },
      email: { type: 'string', validation: valid.isEmail },
      birth: { type: 'string' },
      phone: { type: 'string', validation: valid.isPhone },
      avatar: { type: 'string' },
      gender: { type: 'string' },
      manager: { type: 'boolean' },
    },
    req.body,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.INVALID, message: '参数校验错误', data: result });
    return;
  }

  const profile = res.locals.profile;

  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: { unId: profile.unId } });

  if (!user) {
    fail(res, { code: resCode.MISTAKE, message: '用户不存在' });
    return;
  }
  // 用户状态校验
  if (!user.common.isActive) {
    fail(res, { code: resCode.DISABLED, message: '该用户已禁用' });
    return;
  }

  if (summary.password) summary.password = encryption(summary.password);

  // 字段占用校验
  const duWhere = ['phone', 'email', 'name'].reduce((res, key) => {
    if (summary[key]) res.push({ [key]: summary[key], unId: Not(profile.unId) });
    return res;
  }, []);
  if (duWhere.length) {
    const duplicateUser = await repository.findOne({ where: duWhere });
    if (duplicateUser?.name === summary.name) {
      fail(res, { code: resCode.REFUSE, message: `更新失败，用户名：${duplicateUser.name}已存在` });
      return;
    } else if (duplicateUser?.phone === summary.phone) {
      fail(res, { code: resCode.REFUSE, message: `更新失败，用户手机：${duplicateUser.phone}已存在` });
      return;
    } else if (duplicateUser?.email === summary.email) {
      fail(res, { code: resCode.REFUSE, message: `更新失败，用户邮箱：${duplicateUser.email}已存在` });
      return;
    }
  }

  await repository.update({ unId: profile.unId }, summary);

  next();
};

/**
 * 用户登出CAS
 * 销毁当前用户相关的ST TGT
 * @method DELETE
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { CAS_TGC } = req.cookies;

  const profile = res.locals.profile;

  redis.del(`TGC:${CAS_TGC}`);
  res.clearCookie('CAS_TGC');

  success(res, { message: `用户<${profile.name}>登出成功！` });
  return;
};

/**
 * 授予 ST，ST将会关联当前登录的用户信息，并且根据domain关联app信息
 * 所以在验证ST的时候只能在对应的app站点验证，并获取用户信息
 * @param {url} domain req.query.domain
 * @method POST
 */
export const getST = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
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

  const TGT = res.locals.TGT;

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

  res.redirect(301, `${domain}?ST=${ST}`);
  return;
};
