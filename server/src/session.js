import session from 'express-session';
import { config } from './config/env.js';

export const sessionMiddleware = session({
  name: 'spotify.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 },
});
