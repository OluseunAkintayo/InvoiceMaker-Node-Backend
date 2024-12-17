import jwt from 'jsonwebtoken';
import { Request, RequestHandler } from 'express';
import dayjs from 'dayjs';
import { redis } from './redis';

export interface RequestExt extends Request {
  user: {
    id: string;
    email: string;
    exp: number;
    iat: number;
  } | null;
}

export const check: RequestHandler = async (req, res, next) => {
  const authToken = req.headers.authorization;
  if (authToken) {
    const token = authToken.split(' ')[1];
    const is_invalid = await redis.get(token);
    if (is_invalid) {
      res.status(401).json({ success: false, message: "Token invalid" });
      return;
    }
    if (process.env.CRYPTO_KEY) {
      try {
        const token_res = jwt.verify(token, process.env.CRYPTO_KEY) as { id: string; email: string; exp: number, iat: number };
        if (dayjs(token_res.exp) <= dayjs()) {
          res.status(401).json({ success: false, message: "Token expired" });
          return;
        }
        (req as RequestExt).user = token_res;
        next();
      } catch (error) {
        res.status(403).json({ success: false, message: "Unauthorized access: invalid token.", error });
      }
      return;
    }
    res.status(401).json({ status: 0, message: "Unauthorized access: token not found" });
    return;
  }
  res.status(401).json({ status: 0, message: "Unauthorized access: token not found" });
}


export const checkToken: RequestHandler = (req, res, next) => {
  check(req, res, () => {
    const user = (req as RequestExt).user;
    if (user?.id) return next();
    res.status(403).json({
      success: false,
      message: "Unauthorized access: provided token not valid for specified user"
    });
  });
}
