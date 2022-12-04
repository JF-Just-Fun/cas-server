import { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { has } from 'lodash';
import { dataSource, redis } from '../database';
import { LoginLog, User, Application } from '../models';
import { encryption, valid, getToken, getuuid } from '../util';

/**
 * index
 * @returns '/user'
 */
export const index = (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  res.send('/user');
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
  const { name, ip, domain, desc } = req.body;
  const token = await getToken();

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: [{ ip }, { domain }] });
  console.log(appInfo);

  // user repeated
  if (appInfo) {
    res.status(403).json({
      code: 100,
      msg: `${domain}_${ip} exited!`,
    });
    return;
  }

  await repository.insert({
    name,
    ip,
    domain,
    desc,
    active: true,
    token,
  });

  res.status(200).json({
    code: 0,
    msg: `${name} register success`,
  });
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
  const { name, ip, desc, active } = req.body;
  const { id } = req.params;

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ id: +id });

  // user repeated
  if (!appInfo) {
    res.status(403).json({
      code: 100,
      msg: `${ip} no find!`,
    });
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

  res.status(200).json({
    code: 0,
    msg: `${name} register success`,
  });
  return;
};
