import { z } from 'zod';
import { config } from '../config/index.js';

export const emailDomainValidator = z
  .string()
  .trim()
  .email('Invalid email format')
  .refine(
    (email) => {
      const parts = email.toLowerCase().trim().split('@');
      const allowed = (config.ALLOWED_EMAIL_DOMAIN || 'bvcgroup.in').toLowerCase().trim();
      return parts.length === 2 && parts[1] === allowed;
    },
    {
      message: `Only official college emails under @${config.ALLOWED_EMAIL_DOMAIN || 'bvcgroup.in'} are permitted.`
    }
  );

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: emailDomainValidator,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'FACULTY', 'HOD']).default('STUDENT'),
  rollNumber: z.string().optional(),
  department: z.string().default('CSE'),
  academicYear: z.string().default('III Year'),
  section: z.string().default('3rd Year Section A'),
  designation: z.string().optional(),
  employeeId: z.string().optional(),
  assignedSection: z.string().optional(),
  assignedSubject: z.string().optional(),
  cabin: z.string().optional(),
  adminSecret: z.string().optional()
}).refine(data => Boolean(data.name || data.fullName), {
  message: 'Name is required and must be at least 2 characters',
  path: ['name']
}).transform(data => ({
  ...data,
  name: (data.name || data.fullName).trim()
}));

export const approveUserSchema = z.object({
  email: emailDomainValidator,
  role: z.enum(['STUDENT', 'FACULTY', 'HOD']).optional()
});

export const requestOtpSchema = z.object({
  email: emailDomainValidator,
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET']).default('REGISTRATION')
});

export const verifyOtpSchema = z.object({
  email: emailDomainValidator,
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
});

export const loginSchema = z.object({
  email: emailDomainValidator,
  password: z.string().min(1, 'Password is required')
});

export const addStudentSchema = z.object({
  name: z.string().min(2, 'Student name is required'),
  rollNumber: z.string().min(4, 'Registration / Roll number is required'),
  email: emailDomainValidator.optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  department: z.string().default('CSE'),
  academicYear: z.string().default('3rd Year'),
  section: z.string().min(1, 'Section is required'),
  semester: z.string().default('Semester 1'),
  enrollmentStatus: z.enum(['Active', 'Probation', 'Detained']).default('Active')
});

export const updateStudentSchema = z.object({
  name: z.string().min(2, 'Student name is required').optional(),
  section: z.string().min(1, 'Section is required').optional(),
  academicYear: z.string().optional(),
  department: z.string().optional(),
  enrollmentStatus: z.enum(['Active', 'Probation', 'Detained']).optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  attendancePercentage: z.number().min(0).max(100).optional(),
  internalAvg: z.number().min(0).max(100).optional(),
  cgpa: z.number().min(0).max(10).optional(),
  backlogCount: z.number().min(0).optional()
});

export const markAttendanceSchema = z.object({
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  sessionDate: z.string().min(8, 'Session date is required (YYYY-MM-DD)'),
  sessionSlot: z.string().min(1, 'Session slot is required'),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(['PRESENT', 'ABSENT', 'ON_DUTY'])
    })
  ).min(1, 'Attendance list cannot be empty')
});

export const createAssessmentSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  sectionId: z.string().min(1, 'Section is required'),
  assessmentType: z.enum(['MID_1', 'MID_2', 'ASSIGNMENT_1', 'ASSIGNMENT_2', 'LAB_INTERNAL']),
  maxMarks: z.number().positive('Maximum marks must be greater than 0'),
  assessmentDate: z.string().min(8, 'Assessment date is required')
});

export const enterMarksSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  sectionId: z.string().min(1, 'Section is required'),
  marks: z.array(
    z.object({
      studentId: z.string().min(1),
      scoreObtained: z.number().min(0, 'Score cannot be negative')
    })
  )
});

export const assignFacultySchema = z.object({
  facultyId: z.string().min(1, 'Faculty ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  sectionId: z.string().min(1, 'Section is required'),
  academicYear: z.string().default('III Year'),
  semester: z.string().default('Semester 1')
});

export const interventionSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  supportType: z.enum(['ACADEMIC_MENTORING', 'REMEDIAL_CLASS', 'ATTENDANCE_COUNSELING', 'PEER_STUDY_GROUP']),
  notes: z.string().min(5, 'Observation notes required'),
  followUpDate: z.string().min(8, 'Follow-up date required'),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'RESOLVED']).default('SCHEDULED')
});
