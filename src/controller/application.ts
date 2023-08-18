import { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { dataSource, redis } from '../database';
import { expires, resCode } from '../enums';
import { LoginLog, User, Application } from '../models';
import { encryption, valid, validate, success, fail, getUniCode } from '../util';

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
 * @param req.body.domain string
 * @param req.body.desc string
 * @method POST
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, domain, desc, result } = validate(
    {
      name: { type: 'string', required: true },
      domain: { type: 'string', required: true, validation: valid.isUrl },
      desc: { type: 'string', required: false },
    },
    req.body,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: [{ domain }] });

  // user repeated
  if (appInfo) {
    fail(res, { code: resCode.EXISTED, message: `${domain} existed !` });
    return;
  }

  const token = getUniCode(12);

  repository.insert({
    name,
    domain,
    desc,
    token,
  });

  success(res, { message: `${name}:${domain} registered successful !`, data: { token } });
  return;
};

/**
 * 编辑项目
 * @param req.body.token string
 * @param req.body.domain string
 * @param req.body.name string
 * @param req.body.desc string
 * @param req.body.expire string
 * @method PUT
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, token, domain, desc, expire, result } = validate(
    {
      token: { type: 'string', required: true },
      name: { type: 'string' },
      domain: { type: 'string', validation: valid.isUrl },
      desc: { type: 'string' },
      expire: { type: 'timestamp' },
    },
    req.body,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ token });

  if (!appInfo) {
    fail(res, { code: resCode.NOT_EXIST, message: `token: ${token} not existed!` });
    return;
  }

  await repository.update(
    { token },
    {
      name,
      desc,
      domain,
      expire,
    },
  );

  delete appInfo.common;

  success(res, { message: `app: ${token} updated!!!` });
  return;
};

/**
 * 删除项目
 * @param req.body.id string
 * @method DELETE
 */
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { token, result } = validate(
    {
      token: { type: 'string', required: true },
    },
    req.query,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ token });

  // user repeated
  if (!appInfo) {
    fail(res, { code: resCode.NOT_EXIST, message: `token: ${token} not registered!` });
    return;
  }

  repository.remove(appInfo);

  success(res, { message: `${appInfo.name} has been removed!` });
  return;
};

/**
 * 项目列表
 * @param req.query.domain string
 * @param req.query.token string
 * @param req.query.name string
 * @param req.query.page string
 * @param req.query.size string
 * @method GET
 */
export const query = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { page, size, token, domain, name, result } = validate(
    {
      page: { type: 'number', default: 1 },
      size: { type: 'number', default: 20 },
      token: { type: 'string' },
      name: { type: 'string' },
      domain: { type: 'string' },
    },
    req.query,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const params = { token, name, domain };
  const where = Object.keys(params).reduce((acc, key) => {
    const value = params[key];
    if (value !== undefined) {
      acc.push({ [key]: value, common: { isActive: true } });
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

  const List = appList[0].reduce((res, item) => {
    if (item.common) delete item.common;
    res.push(item);
    return res;
  }, []);

  success(res, {
    message: '成功',
    data: List,
    count: appList[1],
  });
  return;
};
