'use strict';

var express = require('express');
var axios = require('axios');
var session = require('express-session');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P
      ? value
      : new P(function (resolve) {
          resolve(value);
        });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator['throw'](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

function __generator(thisArg, body) {
  var _ = {
      label: 0,
      sent: function () {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: [],
    },
    f,
    y,
    t,
    g;
  return (
    (g = { next: verb(0), throw: verb(1), return: verb(2) }),
    typeof Symbol === 'function' &&
      (g[Symbol.iterator] = function () {
        return this;
      }),
    g
  );
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError('Generator is already executing.');
    while ((g && ((g = 0), op[0] && (_ = 0)), _))
      try {
        if (
          ((f = 1),
          y &&
            (t = op[0] & 2 ? y['return'] : op[0] ? y['throw'] || ((t = y['return']) && t.call(y), 0) : y.next) &&
            !(t = t.call(y, op[1])).done)
        )
          return t;
        if (((y = 0), t)) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2]) _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}

typeof SuppressedError === 'function'
  ? SuppressedError
  : function (error, suppressed, message) {
      var e = new Error(message);
      return (e.name = 'SuppressedError'), (e.error = error), (e.suppressed = suppressed), e;
    };

var Cas = /** @class */ (function () {
  function Cas(option) {
    var _this = this;
    this.token = '';
    this.domain = '';
    this.apiMap = {
      login: '/login',
      logout: '/logout',
      profile: '/profile',
    };
    this.checkST = function (req, res, next) {
      return __awaiter(_this, void 0, void 0, function () {
        var ST, response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              ST = req.query.ST;
              return [
                4 /*yield*/,
                axios.post(Cas.serviceUrl + '/user/st', { ST: ST, token: this.token, domain: this.domain }),
              ];
            case 1:
              response = _a.sent();
              console.log('=> checkST', response);
              if (response.data.code !== 0) {
                res.redirect(Cas.loginPage);
                return [2 /*return*/];
              }
              req.session.user = response.data.data;
              res.status(200).json(response.data.data);
              return [2 /*return*/];
          }
        });
      });
    };
    this.logout = function (req, res, next) {
      return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          req.session.user = null;
          res.status(200).json({ data: '退出成功！' });
          return [2 /*return*/];
        });
      });
    };
    this.profile = function (req, res, next) {
      return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          if (!req.session.user) res.status(401).json({ message: '未登录！' });
          res.status(200).json({ data: req.session.user });
          return [2 /*return*/];
        });
      });
    };
    this.token = option.token;
    this.domain = option.domain;
    this.router = express.Router();
    Object.assign(this.apiMap, option.apiMap);
    // 载入session
    this.router.use(
      session({
        secret: 'yinpo-cas-client-session-secret-key',
        resave: false,
        saveUninitialized: true,
      }),
    );
  }
  Cas.prototype.core = function () {
    this.router.get(this.apiMap.login, this.checkST);
    this.router.get(this.apiMap.logout, this.logout);
    this.router.get(this.apiMap.profile, this.profile);
    return this.router;
  };
  Cas.loginPage = 'https://yinpo.space/cas'; // CAS login page url
  Cas.serviceUrl = 'https://api.yinpo.space/cas'; // CAS service base url
  Cas.prefixPath = '/cas-server';
  Cas.casApi = {
    validate: '/user/st',
  };
  return Cas;
})();

module.exports = Cas;
