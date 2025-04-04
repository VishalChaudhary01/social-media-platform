import express from 'express';
import cookieParser from 'cookie-parser';
import { PORT } from './config/env';
import { errorMiddleware, ErrorResponse } from './middlewares/error.middleware';
import authRoutes from './routes/auth.route';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);

app.get(/(.*)/, (_req, _res) => {
  throw new ErrorResponse('No auth-service found on given API URL', 404);
});

app.use(errorMiddleware);

app.listen(PORT, () =>
  console.log(`Auth service started on http://localhost:${PORT}`)
);
