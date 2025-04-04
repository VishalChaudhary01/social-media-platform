import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import { authMiddleware } from '../middlewares/auth.middleware';
import { MAX_FILE_SIZE } from '../config/constant';
import {
  AUTH_SERVICE_URL,
  COMMENT_SERVICE_URL,
  FEED_SERVICE_URL,
  LIKE_SERVICE_URL,
  MEDIA_SERVICE_URL,
  MESSAGE_SERVICE_URL,
  POSTS_SERVICE_URL,
  USER_SERVICE_URL,
} from '../config/env';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

router.post(
  '/auth/signup',
  upload.single('profilePic'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let profilePic = null;
      if (req.file) {
        const form = new FormData();

        form.append('image', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });

        const mediaRes = await axios.post(
          `${MEDIA_SERVICE_URL}/media/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'Content-Length': form.getLengthSync(),
            },
          }
        );
        profilePic = mediaRes.data.imageUrl;
      }

      const signupData = {
        ...req.body,
        profilePic: profilePic,
      };

      const authRes = await axios.post(
        `${AUTH_SERVICE_URL}/auth/signup`,
        signupData
      );

      res.status(authRes.status).json(authRes.data);
    } catch (error) {
      console.error('Signup error:', error);
      next(error);
    }
  }
);

router.use(
  '/auth',
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
  })
);

router.use(
  '/users',
  authMiddleware,
  createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
  })
);

router.use(
  '/feedS',
  authMiddleware,
  createProxyMiddleware({
    target: FEED_SERVICE_URL,
    changeOrigin: true,
  })
);

router.use(
  '/posts',
  authMiddleware,
  createProxyMiddleware({
    target: POSTS_SERVICE_URL,
    changeOrigin: true,
  })
);

router.use(
  '/comments',
  authMiddleware,
  createProxyMiddleware({
    target: COMMENT_SERVICE_URL,
    changeOrigin: true,
  })
);

router.use(
  '/likes',
  authMiddleware,
  createProxyMiddleware({
    target: LIKE_SERVICE_URL,
    changeOrigin: true,
  })
);

router.use(
  '/messages',
  authMiddleware,
  createProxyMiddleware({
    target: MESSAGE_SERVICE_URL,
    changeOrigin: true,
  })
);

router.use(
  '/media',
  authMiddleware,
  createProxyMiddleware({
    target: MEDIA_SERVICE_URL,
    changeOrigin: true,
  })
);

export default router;
