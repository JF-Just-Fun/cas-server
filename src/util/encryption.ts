import crypto from 'crypto';

/**
 * 对数据使用sha1方式加密
 * @param data string
 * @returns string
 */
export const encryption = (data: crypto.BinaryLike): string => {
  return crypto.createHmac('sha1', process.env.CRYPTO_SECRET).update(data).digest('hex');
};
