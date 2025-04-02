import express from 'express';
import { PORT } from './config/env';

const app = express();

app.get('/', (_req, res) => {
  res.send('Healthy auth service');
});

app.listen(PORT, () =>
  console.log(`Auth service started on http://localhost:${PORT}`)
);
