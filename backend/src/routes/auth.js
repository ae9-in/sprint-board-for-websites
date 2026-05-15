import express from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Organization, User, RefreshToken, InviteToken, ActivityLog } from '../models/index.js';
import { trackActivity } from '../utils/activity.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpiry } from '../utils/jwt.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../utils/validators.js';

const router = express.Router();

// POST /api/auth/signup - Create new organization and user
router.post('/signup', async (req, res, next) => {
  try {
    const data = validate(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(2),
      organizationName: z.string().min(2)
    }), req.body);

    // Generate organization slug
    const slug = await Organization.generateSlug(data.organizationName);

    // Create organization and user in transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [organization] = await Organization.create([{
        name: data.organizationName,
        slug,
        ownerEmail: data.email,
        plan: 'FREE',
        isActive: true
      }], { session });

      const [user] = await User.create([{
        organizationId: organization._id,
        fullName: data.fullName,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: 'SUPER_ADMIN',
        userType: 'DEVELOPER',
        isActive: true,
        inviteAccepted: true,
        createdBy: null
      }], { session });

      // Link owner back to organization
      organization.ownerId = user._id;
      await organization.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token
      await RefreshToken.create({
        userId: user._id,
        organizationId: organization._id,
        token: refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: getTokenExpiry('7d')
      });

      // Log activity
      trackActivity({
        organizationId: organization._id,
        userId: user._id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user._id,
        description: 'User signed up',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            userType: user.userType
          },
          organization: {
            id: organization._id,
            name: organization.name,
            slug: organization.slug,
            plan: organization.plan
          }
        },
        message: 'Signup successful'
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, organizationId } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' }
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password is required' }
      });
    }

    const query = { email: email.trim().toLowerCase(), isDeleted: false };
    console.log(`[Login] Attempt for: ${query.email}`);
    const user = await User.findOne(query).lean();

    if (!user) {
      console.log(`[Login] User not found: ${query.email}`);
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'DEBUG: User not found in DB' }
      });
    }

    if (!user.isActive) {
      console.log(`[Login] User is inactive: ${query.email}`);
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'DEBUG: User is inactive' }
      });
    }

    const valid = await comparePassword(password, user.passwordHash);
    console.log(`[Login] Password validation result: ${valid}`);
    if (!valid) {
      console.log(`[Login] Password mismatch for user: ${query.email}`);
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'DEBUG: Password hash mismatch' }
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token with session tracking
    await RefreshToken.create({
      userId: user._id,
      organizationId: user.organizationId,
      token: refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: getTokenExpiry('7d')
    });

    // Get organization
    const organization = await Organization.findById(user.organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'User organization not found' }
      });
    }

    // Log activity
    await trackActivity({
      organizationId: user.organizationId,
      userId: user._id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id,
      description: 'User logged in',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          userType: user.userType
        },
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('[Login Error]:', error); // Added detailed logging
    next(error);
  }
});



// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const data = validate(z.object({
      refreshToken: z.string()
    }), req.body);

    const decoded = verifyRefreshToken(data.refreshToken);

    const storedToken = await RefreshToken.findOne({
      token: data.refreshToken,
      expiresAt: { $gt: new Date() }
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' }
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' }
      });
    }

    // Rotate refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    const newRefreshToken = generateRefreshToken(user._id);
    await RefreshToken.create({
      userId: user._id,
      organizationId: user.organizationId,
      token: newRefreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: getTokenExpiry('7d')
    });

    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      },
      message: 'Token refreshed'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }
      });
    }
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    // Log activity
    await ActivityLog.create({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
      description: 'User logged out',
      createdBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If the email exists, a reset link will be sent'
      });
    }

    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = await hashPassword(resetToken);
    user.passwordResetExpires = resetExpires;
    await user.save();

    // In production, send email with reset link
    // For now, return the token (development only!)
    res.json({
      success: true,
      data: { resetToken }, // Remove in production!
      message: 'Password reset token generated'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const data = validate(z.object({
      token: z.string(),
      password: z.string().min(8)
    }), req.body);

    const user = await User.findOne({
      passwordResetExpires: { $gt: new Date() },
      isDeleted: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' }
      });
    }

    const valid = await comparePassword(data.token, user.passwordResetToken);
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid reset token' }
      });
    }

    // Update password and clear reset tokens
    user.passwordHash = await hashPassword(data.password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Delete all refresh tokens
    await RefreshToken.deleteMany({ userId: user._id });

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/invite/send
router.post('/invite/send', auth, async (req, res, next) => {
  try {
    const data = validate(z.object({
      email: z.string().email(),
      role: z.enum(['SUPER_ADMIN', 'USER']),
      userType: z.enum(['DEVELOPER', 'TESTER', 'UI_UX_DESIGNER', 'DEPLOYMENT_MANAGER', 'PROJECT_COORDINATOR'])
    }), req.body);

    // Check for existing pending invite
    await InviteToken.deleteMany({
      organizationId: req.user.organizationId,
      email: data.email.toLowerCase(),
      expiresAt: { $gt: new Date() }
    });

    // Generate invite token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await InviteToken.create({
      organizationId: req.user.organizationId,
      email: data.email.toLowerCase(),
      token,
      role: data.role,
      userType: data.userType,
      expiresAt,
      invitedBy: req.user.id
    });

    // In production, send invite email
    const inviteLink = `${process.env.FRONTEND_URL}/invite/accept/${token}`;

    res.status(201).json({
      success: true,
      data: { token, inviteLink }, // Remove inviteLink in production!
      message: 'Invitation sent'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/invite/accept - Public endpoint
router.post('/invite/accept', async (req, res, next) => {
  try {
    const data = validate(z.object({
      token: z.string(),
      password: z.string().min(8),
      fullName: z.string().min(2)
    }), req.body);

    const invite = await InviteToken.findOne({
      token: data.token,
      expiresAt: { $gt: new Date() }
    });

    if (!invite) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired invitation' }
      });
    }

    // Create user
    const user = await User.create({
      organizationId: invite.organizationId,
      fullName: data.fullName,
      email: invite.email,
      passwordHash: await hashPassword(data.password),
      role: invite.role,
      userType: invite.userType,
      isActive: true,
      invitedBy: invite.invitedBy,
      inviteAccepted: true,
      createdBy: invite.invitedBy
    });

    // Mark invite as accepted
    invite.acceptedAt = new Date();
    await invite.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: getTokenExpiry('7d')
    });

    // Get organization
    const organization = await Organization.findById(invite.organizationId);

    // Log activity
    await ActivityLog.create({
      organizationId: user.organizationId,
      userId: user._id,
      action: 'USER_JOINED',
      entityType: 'User',
      entityId: user._id,
      description: 'User joined via invitation',
      createdBy: user._id
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          userType: user.userType
        },
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan
        }
      },
      message: 'Invitation accepted'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    const organization = await Organization.findById(req.user.organizationId);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          userType: user.userType,
          isActive: user.isActive
        },
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/sessions - List active sessions
router.get('/sessions', auth, async (req, res, next) => {
  try {
    const sessions = await RefreshToken.find({
      userId: req.user.id,
      isValid: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastUsedAt: -1 }).lean();

    res.json({
      success: true,
      data: sessions.map(s => ({
        id: s._id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        lastUsedAt: s.lastUsedAt,
        isCurrent: s.token === req.body.refreshToken // Optional: identifying current session
      }))
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/sessions/:id - Revoke session
router.delete('/sessions/:id', auth, async (req, res, next) => {
  try {
    const result = await RefreshToken.deleteOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' }
      });
    }

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;