import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config/index.js';
import { store } from './store.js';

let cachedVerifiedSenders = null;
let lastSendersFetchTime = 0;
const SENDERS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export class EmailOtpService {
  static generateOtp() {
    // Generate cryptographically secure 6-digit numeric OTP
    const num = crypto.randomInt(100000, 1000000);
    return num.toString();
  }

  static hashOtp(otp) {
    return crypto.createHash('sha256').update(otp.trim()).digest('hex');
  }

  /**
   * Fetches and caches the list of verified, active senders from Brevo
   */
  static async fetchAuthorizedSenders(forceRefresh = false) {
    const apiKey = config.BREVO_API_KEY ? config.BREVO_API_KEY.trim() : '';
    if (!apiKey || !apiKey.startsWith('xkeysib-')) {
      return [];
    }

    const now = Date.now();
    if (!forceRefresh && cachedVerifiedSenders && (now - lastSendersFetchTime < SENDERS_CACHE_TTL)) {
      return cachedVerifiedSenders;
    }

    try {
      const res = await axios.get('https://api.brevo.com/v3/senders', {
        headers: {
          'api-key': apiKey,
          'Accept': 'application/json'
        },
        timeout: 8000
      });

      if (res.data && Array.isArray(res.data.senders)) {
        cachedVerifiedSenders = res.data.senders.filter(s => s.active === true);
        lastSendersFetchTime = now;
        return cachedVerifiedSenders;
      }
      return [];
    } catch (err) {
      console.warn(`[Brevo Senders Check Warning] Could not fetch verified senders list: ${err.message}`);
      return cachedVerifiedSenders || [];
    }
  }

  /**
   * Validates Brevo API configuration and authorized sender status (safe, no secrets logged)
   */
  static async validateConfiguration() {
    const apiKey = config.BREVO_API_KEY ? config.BREVO_API_KEY.trim() : '';
    const configuredSender = config.BREVO_SENDER_EMAIL ? config.BREVO_SENDER_EMAIL.trim() : '';
    const configuredName = config.BREVO_SENDER_NAME || 'CampusConnect BVC';

    const status = {
      isKeyConfigured: Boolean(apiKey && apiKey.startsWith('xkeysib-')),
      isSenderConfigured: Boolean(configuredSender && configuredSender.includes('@')),
      isSenderVerified: false,
      resolvedSenderEmail: configuredSender,
      resolvedSenderName: configuredName,
      availableSendersCount: 0
    };

    if (!status.isKeyConfigured) {
      return status;
    }

    const senders = await this.fetchAuthorizedSenders(true);
    status.availableSendersCount = senders.length;

    const matched = senders.find(s => s.email.toLowerCase() === configuredSender.toLowerCase());
    if (matched) {
      status.isSenderVerified = true;
      status.resolvedSenderEmail = matched.email;
      status.resolvedSenderName = configuredName || matched.name;
    } else if (senders.length > 0) {
      // Pick first active verified sender as fallback
      status.isSenderVerified = false;
      status.resolvedSenderEmail = senders[0].email;
      status.resolvedSenderName = configuredName || senders[0].name;
    }

    return status;
  }

  /**
   * Resolves an authorized sender from Brevo to ensure the email is never dropped by the relay
   */
  static async resolveEffectiveSender() {
    const configuredSender = config.BREVO_SENDER_EMAIL ? config.BREVO_SENDER_EMAIL.trim() : '';
    const configuredName = config.BREVO_SENDER_NAME || 'CampusConnect BVC';

    if (process.env.NODE_ENV === 'test') {
      return {
        email: configuredSender || 'campusconnect@bvcgroup.in',
        name: configuredName
      };
    }

    const authorizedSenders = await this.fetchAuthorizedSenders();

    if (authorizedSenders.length === 0) {
      if (configuredSender && configuredSender.includes('@')) {
        return { email: configuredSender, name: configuredName };
      }
      throw new Error(
        'Brevo email delivery is not configured: No active senders found in your Brevo account. Please add and verify a sender at https://app.brevo.com/senders'
      );
    }

    // Check if configured sender is authorized
    const isConfiguredVerified = configuredSender && authorizedSenders.some(
      s => s.email.toLowerCase() === configuredSender.toLowerCase()
    );

    if (isConfiguredVerified) {
      return { email: configuredSender, name: configuredName };
    }

    // Fall back to primary verified sender to ensure delivery
    const primaryVerified = authorizedSenders[0];
    if (configuredSender) {
      console.warn(
        `[Brevo Sender Notice] Configured sender '${configuredSender}' is NOT verified in Brevo. Automatically using verified active sender '${primaryVerified.email}' to ensure delivery.`
      );
    }
    return {
      email: primaryVerified.email,
      name: configuredName || primaryVerified.name || 'CampusConnect BVC'
    };
  }

  static async createAndSendOtp(email, purpose = 'REGISTRATION', recipientName = '') {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[EmailOtpService] Request to create and send OTP for recipient: ${normalizedEmail}, Purpose: ${purpose}`);

    // Check existing challenges for rate limiting cooldown
    const existing = store.findById('otpChallenges', normalizedEmail);
    const now = Date.now();

    if (existing) {
      const elapsedSeconds = (now - existing.createdAt) / 1000;
      if (elapsedSeconds < config.OTP_RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(config.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
        console.warn(`[EmailOtpService] Rate limit hit for ${normalizedEmail}: ${remaining}s cooldown remaining`);
        throw new Error(`Please wait ${remaining} seconds before requesting a new verification code.`);
      }
    }

    // Verify Brevo configuration
    const apiKey = config.BREVO_API_KEY ? config.BREVO_API_KEY.trim() : '';

    if (process.env.NODE_ENV === 'test' && (!apiKey || apiKey.includes('your-brevo-api-key'))) {
      console.log(`[EmailOtpService] Test environment detected. Generating test challenge for ${normalizedEmail}`);
      const rawOtp = this.generateOtp();
      const otpHash = this.hashOtp(rawOtp);
      const expiresAt = now + config.OTP_EXPIRY_MINUTES * 60 * 1000;
      store.create('otpChallenges', {
        id: normalizedEmail,
        email: normalizedEmail,
        otpHash,
        purpose,
        attempts: 0,
        createdAt: now,
        expiresAt
      });
      return {
        success: true,
        emailSent: true,
        message: `Verification code dispatched to ${normalizedEmail} (Test Environment).`,
        expiresInMinutes: config.OTP_EXPIRY_MINUTES
      };
    }

    if (!apiKey || apiKey.includes('your-brevo-api-key') || !apiKey.startsWith('xkeysib-')) {
      console.error(`[EmailOtpService] Missing or invalid BREVO_API_KEY in backend configuration`);
      throw new Error(
        'Brevo email delivery is not configured: valid BREVO_API_KEY missing in backend/.env. Please configure a valid Brevo key.'
      );
    }

    // Resolve authorized sender
    const effectiveSender = await this.resolveEffectiveSender();

    // Diagnostic log before OTP generation
    console.log(`[EmailOtpService] Generating secure 6-digit OTP challenge for ${normalizedEmail}...`);
    const rawOtp = this.generateOtp();
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = now + config.OTP_EXPIRY_MINUTES * 60 * 1000;

    const challenge = {
      id: normalizedEmail,
      email: normalizedEmail,
      otpHash,
      purpose,
      attempts: 0,
      createdAt: now,
      expiresAt
    };

    // Store secure challenge (in-memory only, hashed, never plaintext)
    store.create('otpChallenges', challenge);
    console.log(`[EmailOtpService] OTP challenge hash stored securely for ${normalizedEmail}. Expiry: ${config.OTP_EXPIRY_MINUTES}m, Max Attempts: ${config.OTP_MAX_ATTEMPTS}`);

    // Send email via Brevo REST API
    try {
      const brevoPayload = {
        sender: {
          name: effectiveSender.name,
          email: effectiveSender.email
        },
        to: [
          {
            email: normalizedEmail,
            name: recipientName || normalizedEmail.split('@')[0]
          }
        ],
        subject: `Your CampusConnect Verification Code: ${rawOtp}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; background-color: #E3FDFD; padding: 28px; border-radius: 12px; max-width: 520px; margin: 0 auto; border: 1px solid #A6E3E9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #102A43; margin-bottom: 4px; font-size: 22px;">Bonam Venkata Chalamaya Engineering College</h2>
              <p style="color: #0C6B75; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0;">Department of Computer Science & Engineering</p>
            </div>
            <div style="background: #FFFFFF; padding: 20px; border-radius: 8px; border: 1px solid #CBF1F5; text-align: center;">
              <p style="color: #334E68; font-size: 14px; margin-top: 0;">Your official one-time verification code is:</p>
              <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0C6B75; background: #E3FDFD; padding: 14px 24px; display: inline-block; border-radius: 8px; border: 2px solid #71C9CE; font-family: monospace;">
                ${rawOtp}
              </div>
              <p style="color: #627D98; font-size: 12px; margin-top: 18px; margin-bottom: 0;">
                This code is valid for <strong>${config.OTP_EXPIRY_MINUTES} minutes</strong>. For your account security, never share this code with anyone.
              </p>
            </div>
            <p style="color: #627D98; font-size: 11px; text-align: center; margin-top: 16px;">
              CampusConnect &bull; Autonomous Academic Platform &bull; BVC Engineering College
            </p>
          </div>
        `
      };

      console.log(`[Brevo Email Dispatch] Sending verification email via POST https://api.brevo.com/v3/smtp/email to ${normalizedEmail} (From: ${effectiveSender.email})`);
      const res = await axios.post('https://api.brevo.com/v3/smtp/email', brevoPayload, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (res.status === 201 || res.status === 200) {
        console.log(`[Brevo Email Response] Status: ${res.status}, MessageId: ${res.data?.messageId || 'OK'}`);
        return {
          success: true,
          emailSent: true,
          providerStatus: 'ACCEPTED',
          message: `Verification code dispatched to ${normalizedEmail} via Brevo transactional email.`,
          expiresInMinutes: config.OTP_EXPIRY_MINUTES
        };
      } else {
        throw new Error(`Unexpected Brevo response status: ${res.status}`);
      }
    } catch (err) {
      // Diagnostic logging (safe: no sensitive keys, passwords, or OTPs logged)
      const status = err.response?.status;
      const brevoCode = err.response?.data?.code || 'UNKNOWN';
      const brevoMessage = err.response?.data?.message || err.message;

      console.error(`[Brevo Email Diagnostics] HTTP Status: ${status || 'Network Error'}, Error Code: ${brevoCode}, Diagnostic: ${brevoMessage}`);

      // Invalidate the un-dispatched challenge so user is not stuck with an unreceived OTP
      store.delete('otpChallenges', normalizedEmail);

      if (status === 401) {
        throw new Error('Brevo authentication failed (401 Unauthorized): Invalid or revoked BREVO_API_KEY in backend/.env.');
      } else if (status === 400) {
        throw new Error(`Brevo delivery rejected (400 Bad Request): ${brevoMessage}. Check that '${effectiveSender.email}' is a verified sender in your Brevo account.`);
      } else if (status === 402) {
        throw new Error('Brevo delivery failed (402 Payment/Quota): Account email quota exceeded or account suspended.');
      } else {
        throw new Error(`Failed to dispatch email via Brevo (${status || 500}): ${brevoMessage}`);
      }
    }
  }

  static verifyOtp(email, enteredOtp) {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[EmailOtpService] Verifying OTP challenge for ${normalizedEmail}...`);
    const challenge = store.findById('otpChallenges', normalizedEmail);

    if (!challenge) {
      console.warn(`[EmailOtpService] Verification failed: No active challenge found for ${normalizedEmail}`);
      return { success: false, message: 'No active OTP verification session found. Please request a new verification code.' };
    }

    if (Date.now() > challenge.expiresAt) {
      console.warn(`[EmailOtpService] Verification failed: Challenge expired for ${normalizedEmail}`);
      store.delete('otpChallenges', normalizedEmail);
      return { success: false, message: 'The verification code has expired. Please request a new OTP.' };
    }

    if (challenge.attempts >= config.OTP_MAX_ATTEMPTS) {
      console.warn(`[EmailOtpService] Verification failed: Max attempts exceeded for ${normalizedEmail}`);
      store.delete('otpChallenges', normalizedEmail);
      return { success: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    const enteredHash = this.hashOtp(enteredOtp);
    if (enteredHash !== challenge.otpHash) {
      challenge.attempts += 1;
      store.update('otpChallenges', normalizedEmail, { attempts: challenge.attempts });
      const remainingAttempts = config.OTP_MAX_ATTEMPTS - challenge.attempts;
      console.warn(`[EmailOtpService] Incorrect OTP attempt for ${normalizedEmail}. ${remainingAttempts} attempts remaining`);
      return {
        success: false,
        message: `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
      };
    }

    // Success - consume single-use OTP
    console.log(`[EmailOtpService] OTP verified successfully for ${normalizedEmail}. Single-use challenge consumed.`);
    store.delete('otpChallenges', normalizedEmail);
    return { success: true, message: 'Email successfully verified.' };
  }
}
