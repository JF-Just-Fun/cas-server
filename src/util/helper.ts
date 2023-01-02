import { dataSource, redis } from '../database';
import { v4 } from 'uuid';
import { Response } from 'express';

/**
 * 生成唯一token
 * @returns string
 */
export const getToken = async () => {
  let tokenList = await redis.lrange(`cas:token`, 0, -1);
  let str = Math.random().toString(36).substring(2);
  while (tokenList.includes(str)) {
    str = Math.random().toString(36).substring(2);
  }
  await redis.lpush(`cas:token`, str);
  return str;
};

/**
 * 生成登录ST
 * @returns string
 */
export const getST = async () => {
  let tokenList = await redis.lrange(`cas:ST`, 0, -1);
  let str = Math.random().toString(36).substring(2);
  while (tokenList.includes(str)) {
    str = Math.random().toString(36).substring(2);
  }
  redis.lpush(`cas:ST`, str);
  return str;
};

// 生成uuid
export const getuuid = () => {
  let strUUID = v4();
  // 去掉-字符，使用空格代替
  let strUUID2 = strUUID.replace(/-/g, '');
  return strUUID2;
};

type validationRulesType = {
  [key: string]: {
    type: string;
    default?: any;
    required?: boolean;
    from?: any;
    validation?: (value: any) => boolean;
  };
};
type validationDataType = {
  [key: string]: any;
};
type validationType = {
  code: number;
  result?: string[];
} & validationDataType;

export const validate = (rules: validationRulesType, data: validationDataType): validationType => {
  let result: string[] = [];
  if (rules instanceof Object) {
    if (!data) {
      result.push(`参数校验错误，无参数`);
      return { code: -1, result, ...data };
    }

    for (const item in rules) {
      const value = rules[item];

      // from
      if (value.hasOwnProperty('from')) {
        data[item] = value.from[item];
      }

      // default
      if (value.hasOwnProperty('default') && data[item] === undefined) {
        data[item] = value.default;
      }

      // required
      if (data[item] === undefined) {
        if (!value.required) continue;
        result.push(`参数校验错误，缺少参数${item}`);
      }

      // type
      if (value['type'] === 'number') {
        data[item] = parseInt(data[item]);
      }
      if (value['type'] === 'file') {
        continue;
      }
      if (typeof data[item] !== value['type']) {
        result.push(`参数校验错误，参数${item}必须是${value['type']}`);
      }

      //validation
      if (value['validation']) {
        const validation = value['validation'];
        if (!validation(data[item])) {
          result.push(`参数校验错误，参数${item}格式不正确`);
        }
      }
    }

    if (result.length === 0) {
      return { code: 0, ...data };
    }

    return { code: -1, result, ...data };
  }

  return { code: -1, result: ['参数校验规则错误'], ...data };
};

export const success = (res: Response, message: string = 'success', data = {}) => {
  res.status(200).json({
    code: 0,
    message,
    data,
  });
  return;
};

export const fail = (res: Response, code: number, message: string, data = {}) => {
  res.status(200).json({
    code,
    message,
    data,
  });
  return;
};
