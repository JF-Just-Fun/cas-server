import { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { has } from 'lodash';
import { dataSource, redis } from '../database';
import { LoginLog, User } from '../models';
import { encryption, valid, getuuid } from '../util';

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
 * @param req.body.phoneNumber string
 * @param req.body.avatar string
 * @method POST
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, password, email, phoneNumber, avatar } = req.body;
  console.log(email);

  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: [{ email }] });
  console.log(user);

  // user repeated
  if (user) {
    res.status(403).json({
      code: 100,
      msg: `${name} exited!`,
    });
    return;
  }

  await repository.insert({
    name,
    password: encryption(password),
    email,
    phoneNumber,
    avatar,
    account_id: getuuid(),
    active: true,
  });

  res.status(200).json({
    code: 0,
    msg: `${name} register success`,
  });
  return;
};

/**
 * 账号密码登录
 * @param req.body.name string
 * @param req.body.password string
 * @method POST
 */
// export const login = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
//   const { name, email, phoneNumber, code, password } = req.body;

//   // value valid
//   const queryData = {};
//   if (!valid.isEmpty(name)) queryData['name'] = name;
//   if (!valid.isEmpty(password)) queryData['password'] = encryption(req.body.password);
//   if (!valid.isEmpty(email)) queryData['email'] = email;
//   if (!valid.isEmpty(phoneNumber)) queryData['phoneNumber'] = phoneNumber;
//   if (!valid.isEmpty(code)) queryData['code'] = code;

//   if (
//     !(has(queryData, 'name') && has(queryData, 'password')) &&
//     !(has(queryData, 'email') && has(queryData, 'password')) &&
//     !(has(queryData, 'phoneNumber') && has(queryData, 'password')) &&
//     !(has(queryData, 'phoneNumber') && has(queryData, 'code'))
//   ) {
//     next(createError(403, 'Warning! Parameter is required!!!'));
//     return;
//   }

//   // todo: code to login and register
//   // const repository = dataSource.getRepository(User);
//   // const user = await repository.findOne({
//   //   where: { ...queryData },
//   //   relations: {
//   //     login: true,
//   //   },
//   // });

//   if (!user) {
//     res.status(403).json({
//       code: 100,
//       msg: 'name with this password was not found.',
//     });
//     return;
//   }

//   // // create login information
//   // await dataSource.getRepository(Login).insert({
//   //   ip: req.ip,
//   //   mac: req['mac'],
//   //   user: user,
//   // });

//   const { avatar } = user;

//   const token = signToken({ name, email, phoneNumber, avatar });

//   // store the generated JWT after login to verify whether it is the correct
//   redis.setex(`login:${name}`, 2 * 24 * 60 * 60, token);

//   res.status(200).json({
//     code: 0,
//     msg: `${name} login success`,
//     data: {
//       token,
//     },
//   });
//   return;
// };

/**
 * 个人简介
 * @method GET
 */
export const profile = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  if (!req['currentUser']) {
    res.status(401).json({
      code: 100,
      msg: 'Please sign in first!!!',
    });
    return;
  }

  res.status(200).json({
    code: 0,
    data: {
      ...req['currentUser'],
    },
  });
  return;
};
