import { dataSource, redis } from '../database';
import { v4 } from 'uuid';

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
  await redis.lpush(`cas:ST`, str);
  return str;
};

// 生成uuid
export const getuuid = () => {
  let strUUID = v4();
  // 去掉-字符，使用空格代替
  let strUUID2 = strUUID.replace(/-/g, '');
  return strUUID2;
};

export const validate = (res, rules, data) => {
  let result = [];
  if (rules instanceof Object) {
    if (!data) {
      result.push(`参数校验错误，无参数`);
    } else {
      for (const item in rules) {
        const value = rules[item];
        if (value.from) {
          if (!value.from[item]) {
            result.push(`参数校验错误，缺少参数${item}`);
            continue;
          }
          data[item] = value.from[item];
        }
        if (value.required && data[item] === undefined) {
          if (value.dafaultValue) {
            data[item] = value.dafaultValue;
          } else {
            result.push(`参数校验错误，缺少参数${item}`);
          }
        }
        if (value['type'] === 'number') {
          data[item] = parseInt(data[item]);
        }
        if (value['type'] === 'file') {
          continue;
        }
        if (value.required && typeof data[item] !== value['type']) {
          result.push(`参数校验错误，参数${item}必须是${value['type']}`);
        }
      }
      if (result.length === 0) {
        return data;
      } else {
        return { code: -1, result };
      }
    }
  } else {
    return { code: -1, result: ['参数校验错误'] };
  }
};

export const success = (res, message = '成功', data = {}) => {
  res.status(200).json({
    code: 0,
    message,
    data,
  });
  return;
};

export const fail = (res, code, message, data) => {
  res.status(200).json({
    code,
    message,
    data,
  });
  return;
};
