import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No token provided' }
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = {
        id: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role,
        userType: decoded.userType
      };
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Token expired' }
        });
      }
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
      });
    }
  } catch (error) {
    next(error);
  }
}