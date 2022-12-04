import { isEmpty, has, PropertyPath } from 'lodash';

type valueType = 'phone' | 'email' | 'isEmpty';
type valid = {
  [key in valueType]: (value: any) => boolean;
};

export const valid: valid = {
  phone: (value: string) => {
    if (!/^1[3456789]\d{9}$/.test(value)) {
      return false;
    }
    return true;
  },
  email: (value: string) => {
    if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(value)) {
      return false;
    }
    return true;
  },
  isEmpty: (value: any) => isEmpty(value),
};
