declare namespace Express {
  interface Request {
    session?: {
      userinfo: any;
    };
  }
}
