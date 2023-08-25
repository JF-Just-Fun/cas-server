import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { dataSource, redis } from '../database';
import { Application } from '../models';
import { valid, validate, success, fail, decipher } from '../util';
import { resCode } from '../enums';

/**
 * 校验ST凭证，ST关联了用户和app相关信息，只校验app是否正确，然后返回ST关联的用户信息
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
    fail(res, { code: resCode.INVALID, message: result.join(';') });
    return;
  }

  const { TGT: targetTGT, token: targetToken } = await redis.hgetall(`ST:${ST}`);
  redis.del(`ST:${ST}`);

  const repository = dataSource.getRepository(Application);
  const targetApp = await repository.findOne({ where: { token, domain } });

  if (!targetApp) {
    fail(res, { code: resCode.REFUSE, message: `目标应用${domain}未注册！` });
    return;
  }

  if (!targetTGT) {
    fail(res, { code: resCode.REFUSE, message: 'ST认证失败，请重新授权！' });
    return;
  } else if (targetApp.token !== targetToken) {
    fail(res, { code: resCode.REFUSE, message: '应用token不匹配，请重新授权！' });
    return;
  } else if (targetApp.domain !== domain) {
    fail(res, { code: resCode.REFUSE, message: '应用domain不匹配，请重新授权！' });
    return;
  }

  const userInfo = decipher(targetTGT);

  // 提示认证成功
  success(res, { message: 'ST验证成功！', data: userInfo });
  return;
};
