import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { EmailOtpService } from './services/emailService.js';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import hodRoutes from './routes/hodRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Global error handlers to prevent unhandled process crashes
process.on('uncaughtException', (err) => {
  console.error('[CampusConnect Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CampusConnect Unhandled Rejection]:', reason);
});

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-provision-key']
}));

// Body parser
app.use(express.json({ limit: '5mb' }));

// HTTP Request Logging Middleware (Safe: logs method and path only)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[HTTP Request] [${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' }
});
app.use('/api/', apiLimiter);

// Specific OTP rate limiter
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many OTP requests. Please wait a minute.' }
});
app.use('/api/v1/auth/request-otp', otpLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CampusConnect Backend API',
    institution: 'Bonam Venkata Chalamaya Engineering College (BVC)',
    department: 'Computer Science and Engineering (CSE)',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/hod', hodRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[CampusConnect Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test' || process.argv.some(a => a.includes('test'));

if (!isTestEnv) {
  app.listen(config.PORT, async () => {
    console.log(`\n======================================================`);
    console.log(` CampusConnect REST API Server Active `);
    console.log(` Port:        http://localhost:${config.PORT}`);
    console.log(` Health:      http://localhost:${config.PORT}/api/health`);
    console.log(` College:     BVC Engineering College (CSE Dept)`);
    console.log(` Allowed:     @${config.ALLOWED_EMAIL_DOMAIN}`);
    console.log(` ML Service:  ${config.ML_SERVICE_URL}`);
    console.log(` Config Checks:`);
    console.log(`   BREVO_API_KEY:       ${Boolean(config.BREVO_API_KEY) ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
    console.log(`   BREVO_SENDER_EMAIL:   ${Boolean(config.BREVO_SENDER_EMAIL) ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
    console.log(`   BREVO_SENDER_NAME:    ${Boolean(config.BREVO_SENDER_NAME) ? 'CONFIGURED' : 'NOT CONFIGURED'}`);

    // Asynchronously validate authorized sender in Brevo
    try {
      const brevoStatus = await EmailOtpService.validateConfiguration();
      if (brevoStatus.isKeyConfigured) {
        console.log(`   BREVO_AUTH_STATUS:   CONNECTED (${brevoStatus.availableSendersCount} authorized senders found)`);
        console.log(`   ACTIVE_SENDER:       ${brevoStatus.resolvedSenderEmail} (${brevoStatus.isSenderVerified ? 'VERIFIED' : 'FALLBACK ACTIVE SENDER'})`);
      } else {
        console.warn(`   BREVO_AUTH_STATUS:   NOT CONFIGURED - Please configure BREVO_API_KEY in backend/.env`);
      }
    } catch (err) {
      console.warn(`   BREVO_AUTH_STATUS:   VERIFICATION WARNING (${err.message})`);
    }
    console.log(`======================================================\n`);
  });
}

export default app;
