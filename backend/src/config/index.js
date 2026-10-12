import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load backend/.env first
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also load root .env as fallback if present
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'campusconnect_super_secure_jwt_secret_key_2026',
  ALLOWED_EMAIL_DOMAIN: 'bvcgroup.in',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || '',
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || 'CampusConnect BVC',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  OTP_EXPIRY_MINUTES: 5,
  OTP_RESEND_COOLDOWN_SECONDS: 60,
  OTP_MAX_ATTEMPTS: 5,
  ADMIN_PROVISION_KEY: process.env.ADMIN_PROVISION_KEY || 'BVC_ADMIN_PROVISION_2026',
  DATA_SOURCE: process.env.DATA_SOURCE || 'presentation'
};
