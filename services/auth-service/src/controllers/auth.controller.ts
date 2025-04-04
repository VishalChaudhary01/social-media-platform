import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/db';
import { NODE_ENV } from '../config/env';
import { emailQueue } from '../utils/emailQueue';
import { asyncHandler } from '../utils/asyncHandler';
import { saveTokenInCookie } from '../utils/saveTokenInCookie';
import { ErrorResponse } from '../middlewares/error.middleware';
import {
  AUTH_COOKIE_NAME,
  EMAIL_VERIFICATION_COOKIE_EXPIRE_TIME,
  EMAIL_VERIFICATION_LINK_EXPIRE_TIME,
  EMAIL_VERIFICATION_LINK_RESENT_TIME,
  PASSWORD_RESET_EXPIRY_TIME,
  PENDING_EMAIL_VERIFICATION_USER_ID,
} from '../config/constant';
import {
  changePasswordSchema,
  passwordResetSchema,
  resetPasswordRequestSchema,
  signInSchema,
  signUpSchema,
} from '../validators/auth.validator';

/**
 * User registration and send verification email
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const data = signUpSchema.parse(req.body);

  const existingUser = await prisma.user.findFirst({
    where: { email: data.email.toLocaleLowerCase().trim() },
  });
  if (existingUser) throw new ErrorResponse('Email is already registered', 400);

  const hashedPassword = await bcrypt.hash(data.password, 12);

  try {
    const result = await prisma.$transaction(async (txn) => {
      const user = await txn.user.create({
        data: {
          ...data,
          email: data.email.toLocaleLowerCase().trim(),
          password: hashedPassword,
        },
      });

      const token = crypto.randomBytes(32).toString('hex');
      await txn.verificationToken.create({
        data: {
          token,
          identifier: user.id,
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(EMAIL_VERIFICATION_LINK_EXPIRE_TIME),
        },
      });

      await emailQueue.add('sendVerificationEmail', {
        email: user.email,
        verificationToken: token,
      });

      return user;
    });

    res.cookie(PENDING_EMAIL_VERIFICATION_USER_ID, result.id, {
      expires: new Date(EMAIL_VERIFICATION_COOKIE_EXPIRE_TIME),
      httpOnly: true,
      sameSite: 'lax', // need to update to strict
      secure: NODE_ENV === 'production',
    });

    res.status(201).json({
      success: true,
      message:
        'User registered successfully. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Signup error: ', error);
    throw new ErrorResponse(
      'Registration failed. Please try again later.',
      500
    );
  }
});

/**
 * Resend verification email
 */
export const resendVerificationEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const unverifiedUserId = req.cookies?.[PENDING_EMAIL_VERIFICATION_USER_ID];
    if (!unverifiedUserId)
      throw new ErrorResponse(
        'Verification session expired. Please sign up again.',
        400
      );

    const unverifiedUser = await prisma.user.findFirst({
      where: {
        id: unverifiedUserId,
        isVerified: false,
      },
    });
    if (!unverifiedUser)
      throw new ErrorResponse('User not found or already verified', 404);

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: unverifiedUserId, type: 'EMAIL_VERIFICATION' },
    });
    if (!verificationToken)
      throw new ErrorResponse('Verification token not found', 404);

    const isTokenExpired =
      verificationToken.expiresAt.getTime() > new Date().getTime();
    if (isTokenExpired) throw new ErrorResponse('Link expired', 400);

    const isTooEarlyToResend =
      new Date().getTime() - new Date(verificationToken.updatedAt).getTime() <
      EMAIL_VERIFICATION_LINK_RESENT_TIME;
    if (isTooEarlyToResend) throw new ErrorResponse('Too mush request', 400);

    try {
      prisma.$transaction(async (txn) => {
        const token = crypto.randomBytes(32).toString('hex');
        await txn.verificationToken.update({
          where: {
            token_identifier: {
              token: verificationToken.token,
              identifier: verificationToken.identifier,
            },
          },
          data: {
            token,
            expiresAt: new Date(EMAIL_VERIFICATION_LINK_EXPIRE_TIME),
          },
        });

        await emailQueue.add('sendVerificationEmail', {
          email: unverifiedUser.email,
          verificationToken: token,
        });

        return true;
      });

      res.status(200).json({
        success: true,
        message: 'Verification email has been resent. Please check your inbox.',
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      throw new ErrorResponse(
        'Failed to resend verification email. Please try again later.',
        500
      );
    }
  }
);

/**
 * User sign in
 */
export const signin = asyncHandler(async (req: Request, res: Response) => {
  const data = signInSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: { email: data.email.toLocaleLowerCase().trim() },
  });
  if (!user) throw new ErrorResponse('Invalid email or password', 401);
  if (!user.isVerified)
    throw new ErrorResponse('Please verify your email before signing in', 403);

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid)
    throw new ErrorResponse('Invalid email or password', 401);

  saveTokenInCookie(res, user.id);

  res.status(200).json({ success: true, message: 'Sign in successful' });
});

/**
 * Verify email with token
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token || typeof token !== 'string')
    throw new ErrorResponse('Invalid verification token', 400);

  const verificationToken = await prisma.verificationToken.findFirst({
    where: { token, type: 'EMAIL_VERIFICATION' },
  });
  if (!verificationToken) throw new ErrorResponse('Tokne not found', 404);

  const isTokenExpired =
    verificationToken.expiresAt.getTime() < new Date().getTime();
  if (isTokenExpired)
    throw new ErrorResponse(
      'Verification link has expired. Please request a new verification email.',
      400
    );

  try {
    await prisma.$transaction(async (txn) => {
      const user = await txn.user.update({
        where: { id: verificationToken.identifier },
        data: { isVerified: true },
      });

      saveTokenInCookie(res, user.id);

      await txn.verificationToken.deleteMany({
        where: {
          identifier: verificationToken.identifier,
          type: 'EMAIL_VERIFICATION',
        },
      });
      return true;
    });

    res.clearCookie(PENDING_EMAIL_VERIFICATION_USER_ID);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You are now logged in.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    throw new ErrorResponse(
      'Email verification failed. Please try again later.',
      500
    );
  }
});

/**
 * Initiate password reset Request
 */
export const resetPasswordRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = resetPasswordRequestSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { email: email.toLocaleLowerCase().trim() },
    });
    // Don't reveal if email exists (security best practice)
    if (!user) {
      res.status(200).json({
        success: true,
        message:
          'If your email is registered, you will receive a password reset link shortly.',
      });
      return;
    }

    try {
      await prisma.$transaction(async (txn) => {
        await txn.verificationToken.deleteMany({
          where: {
            identifier: user.id,
            type: 'RESET_PASSWORD',
          },
        });

        const token = crypto.randomBytes(32).toString('hex');
        await txn.verificationToken.create({
          data: {
            token,
            identifier: user.id,
            type: 'RESET_PASSWORD',
            expiresAt: new Date(PASSWORD_RESET_EXPIRY_TIME),
          },
        });

        await emailQueue.add('sendPasswordResetEmail', {
          email: user.email,
          resetToken: token,
        });

        return true;
      });

      res.status(200).json({
        success: true,
        message:
          'If your email is registered, you will receive a password reset link shortly.',
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      throw new ErrorResponse(
        'Failed to process password reset request. Please try again later.',
        500
      );
    }
  }
);

/**
 * Verify password reset token
 */
export const verifyResetToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;
    if (!token || typeof token !== 'string')
      throw new ErrorResponse('Invalid reset token', 400);

    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'RESET_PASSWORD',
      },
    });
    if (!resetToken)
      throw new ErrorResponse('Invalid or expired reset token', 400);

    if (resetToken.expiresAt.getTime() < new Date().getTime())
      throw new ErrorResponse(
        'Reset token has expired. Please request a new password reset.',
        400
      );

    res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      userId: resetToken.identifier,
    });
    return;
  }
);

/**
 * Reset password with token
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = passwordResetSchema.parse(req.body);

    if (!token || typeof token !== 'string')
      throw new ErrorResponse('Invalid reset token', 400);

    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'RESET_PASSWORD',
      },
    });

    if (!resetToken)
      throw new ErrorResponse('Invalid or expired reset token', 404);

    if (resetToken.expiresAt < new Date())
      throw new ErrorResponse(
        'Reset token has expired, Please request a new password reset.',
        400
      );

    try {
      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.$transaction(async (txn) => {
        await txn.user.update({
          where: { id: resetToken.identifier },
          data: { password: hashedPassword },
        });

        await txn.verificationToken.deleteMany({
          where: {
            identifier: resetToken.identifier,
            type: 'RESET_PASSWORD',
          },
        });
        return true;
      });
      res.status(200).json({
        success: true,
        message:
          'Password has been reset successfully. You can now sign in with your new password.',
      });
      return;
    } catch (error) {
      console.error('Password reset error:', error);
      throw new ErrorResponse(
        'Failed to reset password. Please try again later.',
        500
      );
    }
  }
);

/**
 * Change password (for authenticated users)
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body
    );

    const userId = req.user?.id;
    if (!userId) throw new ErrorResponse('Authentication required', 401);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new ErrorResponse('User not found', 404);

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid)
      throw new ErrorResponse('Current password is incorrect', 400);

    if (currentPassword === newPassword)
      throw new ErrorResponse(
        'New password must be different from current password',
        400
      );

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }
);

/**
 * Sign out
 */
export const signout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME);

  res.status(200).json({
    success: true,
    message: 'Signed out successfully',
  });
});
