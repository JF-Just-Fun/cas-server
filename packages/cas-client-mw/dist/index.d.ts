import express from 'express';
type apiMapType = {
  login: string;
  logout: string;
  profile: string;
};
type casApiType = {
  validate: string;
};
type optionTypes = {
  token: string;
  domain: string;
  ignore: string[];
  apiMap: apiMapType;
};
export default class Cas {
  static loginPage: string;
  static serviceUrl: string;
  static prefixPath: string;
  static casApi: casApiType;
  private name;
  private token;
  private domain;
  private router;
  private apiMap;
  constructor(option: optionTypes);
  core(): express.Router;
  private checkST;
  private logout;
  private profile;
}
export {};
