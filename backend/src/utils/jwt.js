import jwt from 'jsonwebtoken';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

export function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      organizationId: user.organizationId,
      role: user.role,
      userType: user.userType
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export function getTokenExpiry(expiresIn) {
  const now = new Date();
  const expiry = new Date(now);

  if (expiresIn === ACCESS_EXPIRY) {
    expiry.setMinutes(expiry.getMinutes() + 15);
  } else if (expiresIn === REFRESH_EXPIRY) {
    expiry.setDate(expiry.getDate() + 7);
  }

  return expiry;
}