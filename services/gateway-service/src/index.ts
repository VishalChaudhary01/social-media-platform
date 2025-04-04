import express from 'express';
import morgon from 'morgan';
import cookieParser from 'cookie-parser';
import { PORT } from './config/env';
import { errorMiddleware, ErrorResponse } from './middlewares/error.middleware';
import serviceRoutes from './routes/proxy.route';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(morgon('dev'));

app.get('/', (_req, res) => {
  res.send('Healthy gateway service');
});

app.use('/api/v1/', serviceRoutes);

app.get(/(.*)/, (_req, _res) => {
  throw new ErrorResponse('No service found on given API URL', 404);
});

app.use(errorMiddleware);

app.listen(PORT, () =>
  console.log(`Gateway service running at http://localhost:${PORT}`)
);
