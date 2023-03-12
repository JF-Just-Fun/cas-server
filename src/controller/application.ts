import { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { dataSource, redis } from '../database';
import { resCode } from '../enums';
import { LoginLog, User, Application } from '../models';
import { encryption, valid, getToken, getuuid, validate, success, fail } from '../util';

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
      domain: { type: 'string', required: true },
      desc: { type: 'string', required: false },
    },
    req.body,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }
  // 获取项目唯一标识token
  const token = await getToken();

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: [{ ip }, { domain }] });

  // user repeated
  if (appInfo) {
    fail(res, { code: resCode.EXISTED, message: `${domain}_${ip} exited!` });
    return;
  }

  await repository.insert({
    name,
    ip,
    domain,
    desc,
    unId: getuuid(),
    token,
  });

  success(res);
  return;
};

/**
 * 编辑项目
 * @param req.body.name string
 * @param req.body.ip string
 * @param req.body.domain string
 * @param req.body.desc string
 * @method POST
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, ip, active, desc, code, result } = validate(
    {
      name: { type: 'string', required: true },
      ip: { type: 'string', required: true },
      active: { type: 'number', required: true },
      desc: { type: 'string', required: false },
    },
    req.body,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }
  const { id } = req.params;

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ id: +id });

  // user repeated
  if (!appInfo) {
    fail(res, { code: resCode.NOT_EXIST, message: `${ip} not exited!` });
    return;
  }
  await repository.update(
    { id: +id },
    {
      name,
      ip,
      desc,
      active,
    },
  );

  success(res, { message: `${name} update success` });
  return;
};

/**
 * 删除项目
 * @param req.body.id string
 * @method POST
 */
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { id, code, result } = validate(
    {
      id: { type: 'string', required: true },
    },
    req.params,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ unId: id });

  // user repeated
  if (!appInfo) {
    fail(res, { code: resCode.NOT_EXIST, message: `${appInfo.name} not registered!` });
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
 * @method POST
 */
export const list = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { page, size, domain, ip, code, result } = validate(
    {
      page: { type: 'number', required: true },
      size: { type: 'number', required: true },
      domain: { type: 'string', required: false },
      ip: { type: 'string', required: false },
    },
    req.query,
  );
  // 参数校验
  if (code) {
    fail(res, { code: resCode.MISTAKE, message: `参数校验错误`, data: result });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appList = await repository.findAndCount({ take: size, skip: (page - 1) * size });
  console.log(appList);

  // user repeated
  if (!appList) {
    fail(res, { code: resCode.EXISTED, message: `查询失败` });
    return;
  }
  success(res, {
    message: '成功',
    data: {
      rows: appList[0] || [],
      count: appList[1] || 0,
    },
  });
  return;
};
