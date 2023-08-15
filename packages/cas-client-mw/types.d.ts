import type session from 'express-session';

type mySession = {
  user?: any;
};

declare module 'express' {
  interface Request {
    session: session.Session & Partial<session.SessionData> & mySession;
  }
}
