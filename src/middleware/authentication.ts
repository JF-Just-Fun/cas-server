import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { redis, dataSource } from '../database';
import { expires, resCode } from '../enums';
import { decipher, fail } from '../util';
import { User } from '../models';

/**
 * 根据cookie校验manager身份
 */
export async function isManager(req: Request, res: Response, next: NextFunction): Promise<RequestHandler> {
  // 用户身份验证
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

  if (!profile.manager) {
    fail(res, { code: resCode.REFUSE, message: '当前用户没有权限！' });
    return;
  }

  next();
}

/**
 * 校验用户身份
 */
export async function isUser(req: Request, res: Response, next: NextFunction): Promise<RequestHandler> {
  // 用户身份验证
  const { CAS_TGC } = req.cookies;
  if (!CAS_TGC) {
    fail(res, { code: resCode.REFUSE, message: 'cookie为空，请先登录！' });
    return;
  }

  const TGT = await redis.getex(`TGC:${CAS_TGC}`, 'EX', expires.TGC_EXPIRE);
  if (!TGT) {
    fail(res, { code: resCode.REFUSE, message: '登录过期，请重新登录！' });
    return;
  }

  const profile = decipher(TGT);
  if (!profile) {
    res.clearCookie('CAS_TGC');
    fail(res, { data: resCode.REFUSE, message: '用户不存在！' });
    return;
  }

  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: { ...profile } });
  if (!user) {
    res.clearCookie('CAS_TGC');
    fail(res, { code: resCode.REFUSE, message: '用户不存在！' });
    return;
  }

  next();
}
