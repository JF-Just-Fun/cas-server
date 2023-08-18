import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { redis } from '../database';
import { expires, resCode } from '../enums';
import { decipher, fail } from '../util';

/**
 * 根据cookie校验manager身份
 * 校验TGT数据中是否存在manage权限
 */
export async function isManager(req: Request, res: Response, next: NextFunction): Promise<RequestHandler> {
  // 用户身份验证
  const { CAS_TGC } = req.cookies;
  if (!CAS_TGC) {
    fail(res, { code: resCode.REFUSE, message: '未登录，请先登录！' });
    return;
  }

  const TGT = await redis.getex(`TGC:${CAS_TGC}`, 'EX', expires.TGC_EXPIRE);
  if (!TGT) {
    fail(res, { code: resCode.REFUSE, message: '登录失效，请重新登录！' });
    return;
  }

  const profile = decipher(TGT);
  if (!profile) {
    fail(res, { code: resCode.REFUSE, message: '登录无效，请重新登录！' });
    return;
  }

  if (!profile.manager) {
    fail(res, { code: resCode.IN_PRIVILEGE, message: '当前用户没有权限！' });
    return;
  }

  res.locals.profile = profile;

  next();
}

/**
 * 校验用户身份，只验证TGT是否存在
 */
export async function isUser(req: Request, res: Response, next: NextFunction): Promise<RequestHandler> {
  // 用户身份验证
  const { CAS_TGC } = req.cookies;
  if (!CAS_TGC) {
    fail(res, { code: resCode.REFUSE, message: '未登录，请先登录！' });
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

  res.locals.profile = profile;
  res.locals.TGT = TGT;

  next();
}
