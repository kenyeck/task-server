import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { auth, authorize } from './routes/auth.js';
import users from './routes/users.js';
import tasks from './routes/tasks.js';
import files from './routes/files.js';
import records from './routes/records.js';
import { errorHandler } from './error.js';
import { connectDb } from './db/connection.js';

import { seedTasks } from './db/seed.js';
seedTasks();

const domain = process.env.SERVER_DOMAIN || 'localhost';
const port = process.env.SERVER_PORT || 3001;
const app = express();
const apiLimiter = rateLimit({
   windowMs: 5 * 60 * 1000,
   max: 50
});
const authLimiter = rateLimit({
   windowMs: 10 * 60 * 1000,
   max: 5
});

// security and logging middleware
app.use(helmet()); // security headers
app.use(morgan('combined')); // logging
app.use(cors()); // enable CORS

app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);
app.use('/api/users', authorize(['admin']), users);
app.use('/api/tasks', authorize(), tasks);
app.use('/api/records', authorize(), records);
app.use('/api/files', authorize(), files);
app.use('/auth', authLimiter, auth);

// error handling middleware
app.use(errorHandler);

await connectDb();

app.listen(port, () => {
   console.log(`Server is running on http://${domain}:${port}`);
});

export default app;