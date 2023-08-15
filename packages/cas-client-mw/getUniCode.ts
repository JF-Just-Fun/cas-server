/**
 * 随机字符
 * @param {number} number default 16
 * @param {string} prefix
 * @param {string} suffix
 */
export default (length: number = 16, prefix: string = '', suffix: string = ''): string => {
  if (length < 6) length = 6;

  const upperOrLower = [String.prototype.toLowerCase, String.prototype.toUpperCase];

  return (
    prefix +
    Array.from({ length }, () => {
      const m = Math.random();
      return upperOrLower[Math.floor(m * upperOrLower.length)].call(m.toString(36).slice(-1));
    }).join('') +
    suffix
  );
};
