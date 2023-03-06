import crypto from 'crypto';
import { uniqueId } from 'lodash';

/**
 * 对数据使用sha1方式加密(加盐)(不可逆加密)
 * @param data string
 * @returns {string} 加密数据
 */
export const encryption = (data: crypto.BinaryLike, salt: string = ''): string => {
  return crypto
    .createHmac('sha1', process.env.CRYPTO_SECRET + salt)
    .update(data)
    .digest('hex');
};

/**
 * 计算字符串哈希 使用sha1算法(不可逆加密)
 * @param data string
 * @returns {string} 返回哈希值
 */
export const cryptoHASH = (data: string) => {
  return crypto.createHash('sha1').update(data).digest('hex');
};

const CRYPTO_KEY = crypto.scryptSync(process.env.CRYPTO_KEY, 'GfG', 32);
const CRYPTO_IV = crypto.scryptSync(process.env.CRYPTO_IV, 'GfG', 16);

/**
 * 数据加密
 * @param data 需要加密的数据
 * @returns 加密后的数据
 */
export const cipher = (data: object) => {
  const dataStr = JSON.stringify(data);
  // 加密
  const cipher = crypto.createCipheriv('aes-256-cbc', CRYPTO_KEY, CRYPTO_IV);
  // 更新加密数据
  let ciphered = cipher.update(dataStr, 'utf8', 'hex');
  // 生成加密数据
  ciphered += cipher.final('hex');
  return ciphered;
};

/**
 * 数据解密
 * @param data 需要解密的数据
 * @returns 解密后的数据
 */
export const decipher = (data: string) => {
  // 解密
  const decipher = crypto.createDecipheriv('aes-256-cbc', CRYPTO_KEY, CRYPTO_IV);
  // 更新解密数据
  let decrypted = decipher.update(data, 'hex', 'utf8');
  // 生成解密数据
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};
