// =============== lib/session.js ===============
// Configuration for encrypted session cookies using iron-session.
import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next';

const sessionOptions = {
  password: process.env.JWT_SECRET,
  cookieName: 'm3u-player-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export function withSessionRoute(handler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withSessionSsr(handler) {
    return withIronSessionSsr(handler, sessionOptions);
}

