import type { Response } from 'express';
import { resCode } from '../enums';

/**
 * 生成unId
 */
export const getUnId = (length: number = 8): string => {
  if (length < 8) length = 8;

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
};

/**
 * 随机字符
 * @param {number} number
 */
export const randomStr = (n: number = 16): string => {
  return Array.from({ length: n }, () => Math.random().toString(36).slice(-1)).join('');
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
      result.push(`无参数`);
      return { code: -1, result, ...data };
    }

    for (const item in rules) {
      const value = rules[item];

      // from
      if (value.hasOwnProperty('from') && typeof value.from === 'object') {
        data[item] = data[item] || value.from[item];
      }

      // default
      if (value.hasOwnProperty('default') && data[item] === undefined) {
        data[item] = value.default;
      }

      // required
      if (data[item] === undefined) {
        if (!value.required) continue;
        result.push(`缺少参数${item}`);
        continue;
      }

      // type
      let skipType = false;
      switch (value['type']) {
        case 'number':
          data[item] = parseInt(data[item]);
          break;
        case 'timestamp':
          data[item] = new Date(parseInt(data[item]));
          skipType = !isNaN(Date.prototype.getTime.call(data[item]));
          break;
        default:
      }
      if (!skipType && typeof data[item] !== value['type']) {
        result.push(`参数${item}必须是${value['type']}`);
      }

      //validation
      if (value['validation']) {
        const validation = value['validation'];
        if (!validation(data[item])) {
          result.push(`参数${item}格式不正确`);
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

type ResponseData = {
  code?: number;
  message?: string;
  data?: any;
};
// request success
export const success = (res: Response, data: ResponseData = {}) => {
  res.status(200).json({
    code: resCode.SUCCESS,
    message: '请求成功！',
    ...data,
  });
};

// request fail
export const fail = (res: Response, data: ResponseData = {}) => {
  res.status(200).json({
    code: resCode.FAIL,
    message: '请求失败！',
    ...data,
  });
};
