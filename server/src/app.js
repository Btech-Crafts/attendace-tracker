import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import timetableRoutes from './routes/timetable.js';
import holidayRoutes from './routes/holidays.js';
import attendanceRoutes from './routes/attendance.js';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_ORIGIN, 'http://localhost:5173'].filter(Boolean),
  credentials: false
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  return res.status(status).json({
    message: error.message || 'Internal server error'
  });
});
