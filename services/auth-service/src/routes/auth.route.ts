import express from 'express';
import {
  changePassword,
  resendVerificationEmail,
  resetPassword,
  resetPasswordRequest,
  signin,
  signout,
  signup,
  verifyEmail,
  verifyResetToken,
} from '../controllers/auth.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/resend-verification-email', resendVerificationEmail);
router.post('/signin', signin);
router.get('/verify-email/:token', verifyEmail);
router.post('/reset-password-request', resetPasswordRequest);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password/:token', resetPassword);

router.post('/change-password', isAuthenticated, changePassword);
router.post('/signout', isAuthenticated, signout);

export default router;
