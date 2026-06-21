import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      phoneVerified: user.phoneVerified === true,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function signShortToken(payload, expiresInSeconds) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: expiresInSeconds });
}

export function verifyShortToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
