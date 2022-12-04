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

// 生成uuid
export const getuuid = () => {
  let strUUID = v4();
  // 去掉-字符，使用空格代替
  let strUUID2 = strUUID.replace(/-/g, '');
  return strUUID2;
};
