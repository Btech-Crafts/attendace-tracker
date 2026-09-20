import jwt from 'jsonwebtoken';

export function signToken(user, secret) {
  return jwt.sign(
    { sub: String(user.id), username: user.username },
    secret,
    { expiresIn: '7d' }
  );
}
