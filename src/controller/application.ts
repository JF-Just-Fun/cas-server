import { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { dataSource, redis } from '../database';
import { expires, resCode } from '../enums';
import { LoginLog, User, Application } from '../models';
import { encryption, valid, validate, success, fail, getUnId, randomStr, decipher } from '../util';

/**
 * index
 * @returns '/application'
 */
export const index = (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  res.send('/application');
  return;
};

/**
 * 新增项目
 * @param req.body.name string
 * @param req.body.ip string
 * @param req.body.domain string
 * @param req.body.desc string
 * @method POST
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, ip, domain, desc, code, result } = validate(
    {
      name: { type: 'string', required: true },
      ip: { type: 'string', required: true },
      domain: { type: 'string', required: true, validation: valid.isUrl },
      desc: { type: 'string', required: false },
    },
    req.body,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: [{ ip, domain }] });

  // user repeated
  if (appInfo) {
    fail(res, { code: resCode.EXISTED, message: `${domain}: ${ip} existed !` });
    return;
  }

  const token = getUnId(12);
  const unId = randomStr();

  repository.insert({
    name,
    ip,
    domain,
    desc,
    unId,
    token,
  });

  success(res, { message: `${name}:${domain}: ${ip} registered successful !`, data: { token } });
  return;
};

/**
 * 编辑项目
 * @param req.body.unId string
 * @param req.body.ip string
 * @param req.body.domain string
 * @param req.body.name string
 * @param req.body.desc string
 * @param req.body.expire string
 * @method PUT
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, ip, unId, domain, desc, expire, code, result } = validate(
    {
      unId: { type: 'string', required: true },
      name: { type: 'string', required: false },
      ip: { type: 'string', required: false },
      domain: { type: 'string', required: false },
      desc: { type: 'string', required: false },
      expire: { type: 'timestamp', required: false },
    },
    req.body,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ unId });

  if (!appInfo) {
    fail(res, { code: resCode.NOT_EXIST, message: `${unId} not existed!` });
    return;
  }

  await repository.update(
    { unId },
    {
      name,
      ip,
      desc,
      domain,
      expire,
    },
  );

  delete appInfo.common;

  success(res, { message: `${unId} updated`, data: appInfo });
  return;
};

/**
 * 删除项目
 * @param req.body.id string
 * @method DELETE
 */
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { unId, code, result } = validate(
    {
      unId: { type: 'string', required: true },
    },
    req.query,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ unId });

  // user repeated
  if (!appInfo) {
    fail(res, { code: resCode.NOT_EXIST, message: `${unId} not registered!` });
    return;
  }

  repository.remove(appInfo);

  success(res, { message: `${appInfo.name} has been removed!` });
  return;
};

/**
 * 项目列表
 * @param req.query.domain string
 * @param req.query.page string
 * @param req.query.size string
 * @param req.query.ip string
 * @method GET
 */
export const list = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { page, size, token, name, unId, ip, code, result } = validate(
    {
      page: { type: 'number', default: 1 },
      size: { type: 'number', default: 20 },
      token: { type: 'string', required: false },
      name: { type: 'string', required: false },
      ip: { type: 'string', required: false },
      unId: { type: 'string', required: false },
    },
    req.query,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const params = { token, name, unId, ip };
  const where = Object.keys(params).reduce((acc, key) => {
    const value = params[key];
    if (value !== undefined) {
      acc.push({ [key]: value });
    }
    return acc;
  }, []);

  const repository = dataSource.getRepository(Application);
  const appList = await repository.findAndCount({
    take: size,
    skip: (page - 1) * size,
    where,
  });

  if (!appList) {
    fail(res, { code: resCode.NOT_EXIST, message: `数据不存在` });
    return;
  }

  appList[0].forEach((item) => {
    if (item.common) delete item.common;
  });

  success(res, {
    message: '成功',
    data: {
      rows: appList[0] || [],
      count: appList[1] || 0,
    },
  });
  return;
};

/**
 * 项目详情
 * @param req.query.unId string
 * @method GET
 */
export const query = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { unId, code, result } = validate(
    {
      unId: { type: 'string', required: true },
    },
    req.query,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: { unId } });

  // user repeated
  if (!appInfo || !appInfo.common.isActive) {
    fail(res, { code: resCode.NOT_EXIST, message: `数据不存在` });
    return;
  }

  delete appInfo.common;

  success(res, {
    message: '成功',
    data: {
      ...appInfo,
    },
  });
  return;
};
