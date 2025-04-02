import express from 'express';
import { PORT } from './config/env';
import { errorMiddleware, ErrorResponse } from './middlewares/error.middleware';

const app = express();

app.get('/', (_req, res) => {
  res.send('Healthy auth service');
});

app.get(/(.*)/, (_req, _res) => {
  throw new ErrorResponse('No auth-service found on given API URL', 404);
});

app.use(errorMiddleware);

app.listen(PORT, () =>
  console.log(`Auth service started on http://localhost:${PORT}`)
);
