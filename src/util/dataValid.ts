import { isEmpty, has, PropertyPath } from 'lodash';

type validType = {
  [key: string]: (value: any) => boolean;
};

export const valid: validType = {
  isPhone: (value: string) => {
    return /^1[3456789]\d{9}$/.test(value);
  },
  isEmail: (value: string) => {
    return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(value);
  },
  isUrl: (value: string) => {
    return /(http|https):\/\/([^\r\n]+)/.test(value);
  },
  isEmpty: (value: any) => isEmpty(value),
};
