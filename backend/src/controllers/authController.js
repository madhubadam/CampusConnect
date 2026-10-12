import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { store } from '../services/store.js';
import { EmailOtpService } from '../services/emailService.js';
import { requestOtpSchema, verifyOtpSchema, registerSchema, loginSchema, approveUserSchema } from '../utils/validation.js';

export class AuthController {
  static async requestOtp(req, res) {
    try {
      console.log(`[Auth Request-OTP] Received request for: ${req.body?.email || 'UNKNOWN'}, Purpose: ${req.body?.purpose || 'REGISTRATION'}`);
      const parsed = requestOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        console.warn(`[Auth Request-OTP] Validation failed for ${req.body?.email || 'UNKNOWN'}: ${parsed.error.errors[0]?.message}`);
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid input'
        });
      }

      const { email, purpose } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();

      // For registration, check if account already exists and is verified
      const existingUser = store.findById('users', normalizedEmail);
      if (purpose === 'REGISTRATION' && existingUser && existingUser.isVerified) {
        console.warn(`[Auth Request-OTP] Account already exists and is verified: ${normalizedEmail}`);
        return res.status(409).json({
          success: false,
          message: 'An account with this official college email already exists. Please log in.'
        });
      }

      const recipientName = existingUser ? existingUser.name : '';
      console.log(`[Auth Request-OTP] Calling EmailOtpService for ${normalizedEmail}...`);
      const result = await EmailOtpService.createAndSendOtp(normalizedEmail, purpose, recipientName);
      console.log(`[Auth Request-OTP] OTP successfully dispatched to ${normalizedEmail}`);
      return res.status(200).json(result);
    } catch (err) {
      console.error(`[Auth Request-OTP Error] Failed to dispatch OTP to ${req.body?.email || 'UNKNOWN'}: ${err.message}`);
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to dispatch verification code.'
      });
    }
  }

  static async verifyOtp(req, res) {
    try {
      console.log(`[Auth Verify-OTP] Received verification request for: ${req.body?.email || 'UNKNOWN'}`);
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        console.warn(`[Auth Verify-OTP] Validation failed for ${req.body?.email || 'UNKNOWN'}: ${parsed.error.errors[0]?.message}`);
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid OTP payload'
        });
      }

      const { email, otp } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();
      const verifyResult = EmailOtpService.verifyOtp(normalizedEmail, otp);

      if (!verifyResult.success) {
        console.warn(`[Auth Verify-OTP] Verification failed for ${normalizedEmail}: ${verifyResult.message}`);
        return res.status(400).json(verifyResult);
      }

      // Activate user account upon successful OTP verification
      const user = store.findById('users', normalizedEmail);
      if (user) {
        store.update('users', user.id, { 
          isVerified: true,
          isApproved: true,
          approvalStatus: 'APPROVED'
        });

        if (user.role === 'HOD' || user.role === 'FACULTY') {
          const facId = user.facultyId || (user.role === 'HOD' ? 'HOD_CSE' : `EMP_${user.email.split('@')[0].toUpperCase()}`);
          const existingFac = store.findById('faculty', facId) || store.find('faculty', f => f.email === user.email)[0];
          if (existingFac) {
            store.update('faculty', existingFac.id, {
              role: user.role,
              status: 'ACTIVE',
              isActive: true,
              designation: user.designation || (user.role === 'HOD' ? 'Professor & Head of Department' : 'Assistant Professor')
            });
          }
        }

        store.logAudit('ACCOUNT_ACTIVATED', user, `Account email verified and activated for ${user.role} (${user.name})`);
        console.log(`[Auth Verify-OTP] Success: Account activated in store for ${normalizedEmail} (Role: ${user.role})`);
      } else {
        console.log(`[Auth Verify-OTP] Success: OTP verified for ${normalizedEmail} (User record pending or external)`);
      }

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully. Your account is now active and verified.',
        email: normalizedEmail
      });
    } catch (err) {
      console.error(`[Auth Verify-OTP Exception] Error verifying OTP for ${req.body?.email || 'UNKNOWN'}: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during verification. Please try again.'
      });
    }
  }

  static async register(req, res) {
    try {
      console.log(`[Auth Registration] Initiating registration request for: ${req.body?.email || 'UNKNOWN'}, Role: ${req.body?.role || 'STUDENT'}`);
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        console.warn(`[Auth Registration] Form validation failed for ${req.body?.email || 'UNKNOWN'}: ${parsed.error.errors[0]?.message}`);
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid registration form'
        });
      }

      const {
        name,
        email,
        password,
        role,
        rollNumber,
        department,
        academicYear,
        section,
        designation,
        employeeId,
        assignedSection,
        assignedSubject,
        cabin,
        adminSecret
      } = parsed.data;

      const normalizedEmail = email.toLowerCase().trim();

      const existing = store.findById('users', normalizedEmail);

      // Privilege Escalation Protection:
      // Active undergraduate students on the academic roster cannot register as HOD or Faculty.
      if (role === 'HOD' || role === 'FACULTY') {
        const isEnrolledStudent = store.find('students', s => 
          (s.email && s.email.toLowerCase().trim() === normalizedEmail) ||
          (s.rollNumber && s.rollNumber.toUpperCase().trim() === normalizedEmail.split('@')[0].toUpperCase().trim())
        ).length > 0;
        const isExistingStudentUser = existing && existing.role === 'STUDENT';

        if (isEnrolledStudent || isExistingStudentUser) {
          console.warn(`[Auth Registration] Blocked student privilege escalation attempt for: ${normalizedEmail} to role: ${role}`);
          return res.status(403).json({
            success: false,
            message: `Forbidden: Enrolled students cannot register as ${role === 'HOD' ? 'Head of Department' : 'Faculty'}.`
          });
        }

        if (role === 'HOD') {
          if (!employeeId || !employeeId.trim()) {
            return res.status(400).json({
              success: false,
              message: 'HOD Employee ID is required for department registration.'
            });
          }
        }
      }

      // Valid HOD, Faculty, and Student accounts are directly authorized once email OTP is verified
      const isApproved = true;
      const approvalStatus = 'APPROVED';

      if (existing && existing.isVerified && existing.role === role) {
        console.warn(`[Auth Registration] Registration rejected: Account already exists and is verified: ${normalizedEmail}`);
        return res.status(409).json({
          success: false,
          message: 'An account with this official college email already exists. Please sign in.'
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const studentRoll = rollNumber || normalizedEmail.split('@')[0].toUpperCase();
      const facId = employeeId || (role !== 'STUDENT' ? `EMP_${normalizedEmail.split('@')[0].toUpperCase()}` : undefined);

      const newUser = {
        id: normalizedEmail,
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        role,
        department: department || 'CSE',
        isVerified: false,
        isApproved,
        approvalStatus,
        createdAt: new Date().toISOString()
      };

      if (role === 'STUDENT') {
        newUser.studentId = studentRoll;
        newUser.academicYear = academicYear || 'III Year';
        newUser.section = section || '3rd Year Section A';
      } else if (role === 'FACULTY') {
        newUser.facultyId = facId;
        newUser.designation = designation || 'Assistant Professor';
        newUser.section = assignedSection || '3rd Year Section A';
      } else if (role === 'HOD') {
        newUser.facultyId = facId;
        newUser.designation = 'Professor & HOD';
        newUser.cabin = cabin || 'Block B - Room 204';
      }

      if (existing) {
        store.update('users', existing.id, newUser);
      } else {
        store.create('users', newUser);
      }

      // Role-specific dataset management
      if (role === 'STUDENT') {
        const existingStudent = store.findById('students', studentRoll);
        if (!existingStudent) {
          const studentProfile = {
            id: studentRoll,
            rollNumber: studentRoll,
            name: name.trim(),
            email: normalizedEmail,
            gender: 'MALE',
            department: department || 'CSE',
            academicYear: academicYear || 'III Year',
            section: section || 'Section A',
            semester: 'Semester 1',
            enrollmentStatus: 'Active',
            attendancePercentage: 100.0,
            internalAvg: 80.0,
            cgpa: 7.5,
            backlogCount: 0,
            trendScore: 0.0,
            isSynthetic: false,
            createdAt: new Date().toISOString()
          };
          store.create('students', studentProfile);
        }
      } else if (role === 'FACULTY' || role === 'HOD') {
        const existingFaculty = store.findById('faculty', facId) || store.find('faculty', f => f.email === normalizedEmail)[0];
        const facultyDoc = {
          id: existingFaculty ? existingFaculty.id : facId,
          facultyId: facId,
          name: name.trim(),
          email: normalizedEmail,
          role,
          designation: role === 'HOD' ? (designation || 'Professor & Head of Department') : (designation || 'Assistant Professor'),
          department: department || 'CSE',
          cabin: cabin || (role === 'HOD' ? 'Block B - Room 204' : 'Faculty Cabin 12'),
          assignedSections: assignedSection ? [assignedSection] : ['3rd Year Section A'],
          assignedSubjects: assignedSubject ? [assignedSubject] : ['CS301'],
          status: 'ACTIVE',
          isActive: true
        };

        if (existingFaculty) {
          store.update('faculty', existingFaculty.id, facultyDoc);
        } else {
          facultyDoc.createdAt = new Date().toISOString();
          store.create('faculty', facultyDoc);
        }
      }

      store.logAudit('USER_REGISTERED', newUser, `User registered with role ${role} (Pending OTP verification)`);
      console.log(`[Auth Registration] User record created/updated for ${newUser.email} (Role: ${role}, Pending OTP verification).`);

      // Dispatch Brevo OTP email
      try {
        console.log(`[Auth Registration] Calling EmailOtpService to dispatch verification OTP to ${newUser.email}...`);
        await EmailOtpService.createAndSendOtp(newUser.email, 'REGISTRATION', newUser.name);
        console.log(`[Auth Registration] Registration OTP successfully dispatched to ${newUser.email}`);
      } catch (otpErr) {
        console.error(`[Auth Registration] Brevo OTP dispatch failed for ${newUser.email}: ${otpErr.message}`);
        // Rollback pending user creation if email dispatch fails
        store.delete('users', newUser.id);
        return res.status(400).json({
          success: false,
          message: otpErr.message || 'Failed to dispatch verification email via Brevo.'
        });
      }

      return res.status(201).json({
        success: true,
        requiresVerification: true,
        message: 'Account details registered. Verification OTP has been sent to your official college email.',
        email: newUser.email,
        expiresInMinutes: config.OTP_EXPIRY_MINUTES || 5
      });
    } catch (err) {
      console.error(`[Auth Registration Exception] Unhandled error during registration for ${req.body?.email || 'UNKNOWN'}: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: err.message || 'Registration processing error. Please verify your input and try again.'
      });
    }
  }

  static async login(req, res) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid login credentials'
        });
      }

      const { email, password } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();
      const user = store.findById('users', normalizedEmail);

      if (!user || !user.passwordHash) {
        return res.status(401).json({
          success: false,
          message: 'Invalid college email or password.'
        });
      }

      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      } catch (bcryptErr) {
        console.error('[CampusConnect Bcrypt Error]:', bcryptErr.message);
        isMatch = false;
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid college email or password.'
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          requiresVerification: true,
          email: user.email,
          message: 'Account email has not been verified. Please complete OTP verification.'
        });
      }



      const jwtSecret = config.JWT_SECRET || 'campusconnect_super_secure_jwt_secret_key_2026';
      const token = jwt.sign(
        { email: user.email, role: user.role, name: user.name },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        token,
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
          facultyId: user.facultyId,
          department: user.department,
          section: user.section
        }
      });
    } catch (err) {
      console.error('[CampusConnect Login Exception]:', err.message);
      return res.status(500).json({
        success: false,
        message: 'An unexpected authentication error occurred on the server. Please try again.'
      });
    }
  }

  static async approveUser(req, res) {
    try {
      const parsed = approveUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid approval request'
        });
      }

      // Authorization guard: Requires admin provisioning key header OR authenticated HOD
      const adminKey = req.headers['x-admin-provision-key'];
      const isAdminKey = adminKey === (config.ADMIN_PROVISION_KEY || 'BVC_ADMIN_PROVISION_2026');
      const isHodUser = req.user && req.user.role === 'HOD';

      if (!isAdminKey && !isHodUser) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: College Administrator or HOD authorization required to approve accounts.'
        });
      }

      const { email } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();
      const user = store.findById('users', normalizedEmail);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User account for ${normalizedEmail} was not found.`
        });
      }

      store.update('users', user.id, {
        isApproved: true,
        approvalStatus: 'APPROVED'
      });

      if (user.role === 'FACULTY' && user.facultyId) {
        const facDoc = store.findById('faculty', user.facultyId);
        if (facDoc) {
          store.update('faculty', facDoc.id, { isActive: true, status: 'ACTIVE' });
        }
      }

      store.logAudit(
        'ACCOUNT_APPROVED',
        req.user || { name: 'College Administrator', email: 'admin@bvcgroup.in', role: 'ADMIN' },
        `Approved ${user.role} account for ${user.email} (${user.name})`
      );

      return res.status(200).json({
        success: true,
        message: `Account for ${user.name} (${user.email}) successfully approved and activated.`,
        user: {
          email: user.email,
          role: user.role,
          isApproved: true,
          approvalStatus: 'APPROVED'
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to approve user account.'
      });
    }
  }

  static async getMe(req, res) {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  }

  static async demoLogin(req, res) {
    if (process.env.NODE_ENV !== 'test') {
      return res.status(403).json({
        success: false,
        message: 'Direct demo bypass is disabled. Please authenticate with your credentials on the login page.'
      });
    }

    const { demoRole } = req.body;
    let targetEmail = '';

    switch (demoRole) {
      case 'student_normal':
        targetEmail = '22221a0501@bvcgroup.in';
        break;
      case 'student_risk':
        targetEmail = '22221a0509@bvcgroup.in';
        break;
      case 'faculty':
        targetEmail = 'srinivasarao.k@bvcgroup.in';
        break;
      case 'hod':
        targetEmail = 'hod.cse@bvcgroup.in';
        break;
      default:
        targetEmail = '22221a0501@bvcgroup.in';
    }

    const user = store.findById('users', targetEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: `Demo user ${targetEmail} not found.` });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: `Switched to demo role: ${user.role} (${user.name})`,
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        facultyId: user.facultyId,
        department: user.department,
        section: user.section
      }
    });
  }
}

/**
 * Migration helper to unblock any legitimate existing accounts
 * previously marked pending approval and activate HOD accounts.
 */
export function repairPendingAccounts() {
  if (store.repairAccounts) {
    store.repairAccounts();
  }
}

