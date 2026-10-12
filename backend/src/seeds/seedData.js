import bcrypt from 'bcryptjs';
import { getAuthoritativeStudents } from './studentDatasets.js';

// Pre-hashed password for demo accounts ("Bvc@2026")
const DEMO_PASSWORD_HASH = bcrypt.hashSync('Bvc@2026', 10);

export function buildSeedDatabase() {
  const sections = ['3rd Year Section A', '3rd Year Section B', '3rd Year Section C'];
  const department = 'CSE';
  const academicYear = '3rd Year';
  const semester = 'Semester 1';

  // Authoritative student dataset (Section A: 49, Section B: 42, Section C: 33. Total: 124)
  const students = getAuthoritativeStudents();
  const users = [];
  const feeAccounts = [];
  const riskPredictions = [];

  // Fee Accounts & Student User Logins for authoritative roster
  students.forEach((s, idx) => {
    const studentEmail = `${s.rollNumber.toLowerCase()}@bvcgroup.in`;
    users.push({
      id: studentEmail,
      email: studentEmail,
      passwordHash: DEMO_PASSWORD_HASH,
      name: s.name,
      role: 'STUDENT',
      studentId: s.rollNumber,
      department: 'CSE',
      section: s.section,
      isVerified: true,
      isApproved: true,
      approvalStatus: 'APPROVED'
    });

    const isPaid = idx % 3 !== 0;
    const paidAmt = isPaid ? 55000 : 35000;
    feeAccounts.push({
      id: `FEE_${s.rollNumber}`,
      studentId: s.rollNumber,
      totalSemesterFee: 55000,
      amountPaid: paidAmt,
      outstandingBalance: 55000 - paidAmt,
      status: isPaid ? 'PAID' : 'PARTIAL',
      dueDate: '2026-11-15',
      history: []
    });
  });

  // Backward-compatible demo student account
  users.push({
    id: '22221a0501@bvcgroup.in',
    email: '22221a0501@bvcgroup.in',
    passwordHash: DEMO_PASSWORD_HASH,
    name: 'Demo Student',
    role: 'STUDENT',
    studentId: '24221A0501',
    department: 'CSE',
    section: '3rd Year Section A',
    isVerified: true,
    isApproved: true,
    approvalStatus: 'APPROVED'
  });

  // Subjects
  const subjects = [
    { id: 'CS301', code: 'CS301', name: 'Compiler Design', credits: 4, department: 'CSE', semester: 'Semester 1' },
    { id: 'CS302', code: 'CS302', name: 'Operating Systems', credits: 4, department: 'CSE', semester: 'Semester 1' },
    { id: 'CS303', code: 'CS303', name: 'Computer Networks', credits: 3, department: 'CSE', semester: 'Semester 1' },
    { id: 'CS304', code: 'CS304', name: 'Database Management Systems', credits: 4, department: 'CSE', semester: 'Semester 1' },
    { id: 'CS305', code: 'CS305', name: 'Machine Learning Foundations', credits: 3, department: 'CSE', semester: 'Semester 1' },
    { id: 'CS306', code: 'CS306', name: 'Web Technologies Lab', credits: 2, department: 'CSE', semester: 'Semester 1' }
  ];

  // Faculty Accounts
  const faculty = [
    {
      id: 'FAC001',
      name: 'Dr. K. Srinivasa Rao',
      email: 'srinivasarao.k@bvcgroup.in',
      department: 'CSE',
      designation: 'Associate Professor',
      phone: '+91 94401 23456',
      assignedClasses: [
        { section: '3rd Year Section A', subjectId: 'CS301', subjectName: 'Compiler Design' },
        { section: '3rd Year Section B', subjectId: 'CS301', subjectName: 'Compiler Design' }
      ],
      isActive: true
    },
    {
      id: 'FAC002',
      name: 'Mrs. P. Lakshmi',
      email: 'lakshmi.p@bvcgroup.in',
      department: 'CSE',
      designation: 'Assistant Professor',
      phone: '+91 98481 67890',
      assignedClasses: [
        { section: '3rd Year Section A', subjectId: 'CS302', subjectName: 'Operating Systems' },
        { section: '3rd Year Section C', subjectId: 'CS302', subjectName: 'Operating Systems' }
      ],
      isActive: true
    },
    {
      id: 'FAC003',
      name: 'Mr. M. Vamsi Krishna',
      email: 'vamsikrishna.m@bvcgroup.in',
      department: 'CSE',
      designation: 'Assistant Professor',
      phone: '+91 97001 54321',
      assignedClasses: [
        { section: '3rd Year Section B', subjectId: 'CS303', subjectName: 'Computer Networks' },
        { section: '3rd Year Section C', subjectId: 'CS303', subjectName: 'Computer Networks' }
      ],
      isActive: true
    },
    {
      id: 'FAC004',
      name: 'Dr. S. N. Murthy',
      email: 'snmurthy@bvcgroup.in',
      department: 'CSE',
      designation: 'Professor',
      phone: '+91 99890 11223',
      assignedClasses: [
        { section: '3rd Year Section A', subjectId: 'CS304', subjectName: 'Database Management Systems' },
        { section: '3rd Year Section B', subjectId: 'CS304', subjectName: 'Database Management Systems' },
        { section: '3rd Year Section C', subjectId: 'CS304', subjectName: 'Database Management Systems' }
      ],
      isActive: true
    }
  ];

  // Faculty Users
  faculty.forEach(f => {
    users.push({
      id: f.email,
      email: f.email,
      passwordHash: DEMO_PASSWORD_HASH,
      name: f.name,
      role: 'FACULTY',
      facultyId: f.id,
      department: f.department,
      isVerified: true,
      isApproved: true,
      approvalStatus: 'APPROVED'
    });
  });

  // HOD Accounts
  const hodUser = {
    id: '24221a1226@bvcgroup.in',
    email: '24221a1226@bvcgroup.in',
    passwordHash: DEMO_PASSWORD_HASH,
    name: 'Jami verendra',
    role: 'HOD',
    department: 'CSE',
    designation: 'Professor & Head of Department',
    phone: '+91 94405 99887',
    isVerified: true,
    isApproved: true,
    approvalStatus: 'APPROVED'
  };
  users.push(hodUser);

  users.push({
    id: 'hod.cse@bvcgroup.in',
    email: 'hod.cse@bvcgroup.in',
    passwordHash: DEMO_PASSWORD_HASH,
    name: 'Jami verendra',
    role: 'HOD',
    department: 'CSE',
    designation: 'Professor & Head of Department',
    phone: '+91 94405 99887',
    isVerified: true,
    isApproved: true,
    approvalStatus: 'APPROVED'
  });

  // Teaching assignments
  const teachingAssignments = [
    { id: 'TA001', facultyId: 'FAC001', facultyName: 'Dr. K. Srinivasa Rao', subjectId: 'CS301', subjectName: 'Compiler Design', section: '3rd Year Section A', academicYear: '3rd Year', semester: 'Semester 1' },
    { id: 'TA002', facultyId: 'FAC001', facultyName: 'Dr. K. Srinivasa Rao', subjectId: 'CS301', subjectName: 'Compiler Design', section: '3rd Year Section B', academicYear: '3rd Year', semester: 'Semester 1' },
    { id: 'TA003', facultyId: 'FAC002', facultyName: 'Mrs. P. Lakshmi', subjectId: 'CS302', subjectName: 'Operating Systems', section: '3rd Year Section A', academicYear: '3rd Year', semester: 'Semester 1' },
    { id: 'TA004', facultyId: 'FAC002', facultyName: 'Mrs. P. Lakshmi', subjectId: 'CS302', subjectName: 'Operating Systems', section: '3rd Year Section C', academicYear: '3rd Year', semester: 'Semester 1' },
    { id: 'TA005', facultyId: 'FAC003', facultyName: 'Mr. M. Vamsi Krishna', subjectId: 'CS303', subjectName: 'Computer Networks', section: '3rd Year Section B', academicYear: '3rd Year', semester: 'Semester 1' },
    { id: 'TA006', facultyId: 'FAC003', facultyName: 'Mr. M. Vamsi Krishna', subjectId: 'CS303', subjectName: 'Computer Networks', section: '3rd Year Section C', academicYear: '3rd Year', semester: 'Semester 1' },
    { id: 'TA007', facultyId: 'FAC004', facultyName: 'Dr. S. N. Murthy', subjectId: 'CS304', subjectName: 'Database Management Systems', section: '3rd Year Section A', academicYear: '3rd Year', semester: 'Semester 1' },
    { id: 'TA008', facultyId: 'FAC004', facultyName: 'Dr. S. N. Murthy', subjectId: 'CS304', subjectName: 'Database Management Systems', section: '3rd Year Section B', academicYear: '3rd Year', semester: 'Semester 1' },
    { id: 'TA009', facultyId: 'FAC004', facultyName: 'Dr. S. N. Murthy', subjectId: 'CS304', subjectName: 'Database Management Systems', section: '3rd Year Section C', academicYear: '3rd Year', semester: 'Semester 1' }
  ];

  // Attendance Sessions & Assessments
  const attendanceSessions = [
    {
      id: 'SESS_20261001_SECA_CS301',
      sectionId: '3rd Year Section A',
      subjectId: 'CS301',
      subjectName: 'Compiler Design',
      facultyId: 'FAC001',
      facultyName: 'Dr. K. Srinivasa Rao',
      sessionDate: '2026-10-01',
      sessionSlot: '09:30 AM - 10:30 AM',
      presentCount: 45,
      absentCount: 4,
      totalCount: 49,
      createdAt: '2026-10-01T10:35:00Z'
    },
    {
      id: 'SESS_20261003_SECA_CS302',
      sectionId: '3rd Year Section A',
      subjectId: 'CS302',
      subjectName: 'Operating Systems',
      facultyId: 'FAC002',
      facultyName: 'Mrs. P. Lakshmi',
      sessionDate: '2026-10-03',
      sessionSlot: '11:00 AM - 12:00 PM',
      presentCount: 43,
      absentCount: 6,
      totalCount: 49,
      createdAt: '2026-10-03T12:05:00Z'
    },
    {
      id: 'SESS_20261005_SECB_CS301',
      sectionId: '3rd Year Section B',
      subjectId: 'CS301',
      subjectName: 'Compiler Design',
      facultyId: 'FAC001',
      facultyName: 'Dr. K. Srinivasa Rao',
      sessionDate: '2026-10-05',
      sessionSlot: '02:00 PM - 03:00 PM',
      presentCount: 38,
      absentCount: 4,
      totalCount: 42,
      createdAt: '2026-10-05T15:05:00Z'
    }
  ];

  const assessments = [
    {
      id: 'ASM_MID1_CS301_SECA',
      subjectId: 'CS301',
      subjectName: 'Compiler Design',
      sectionId: '3rd Year Section A',
      assessmentType: 'MID_1',
      maxMarks: 30,
      passingMarks: 12,
      assessmentDate: '2026-09-18',
      conductedBy: 'Dr. K. Srinivasa Rao'
    },
    {
      id: 'ASM_MID1_CS302_SECA',
      subjectId: 'CS302',
      subjectName: 'Operating Systems',
      sectionId: '3rd Year Section A',
      assessmentType: 'MID_1',
      maxMarks: 30,
      passingMarks: 12,
      assessmentDate: '2026-09-20',
      conductedBy: 'Mrs. P. Lakshmi'
    },
    {
      id: 'ASM_ASSIGN1_CS301_SECA',
      subjectId: 'CS301',
      subjectName: 'Compiler Design',
      sectionId: '3rd Year Section A',
      assessmentType: 'ASSIGNMENT_1',
      maxMarks: 10,
      passingMarks: 4,
      assessmentDate: '2026-09-25',
      conductedBy: 'Dr. K. Srinivasa Rao'
    }
  ];

  const marks = [
    {
      id: 'MARK_24221A0501_MID1_CS301',
      studentId: '24221A0501',
      assessmentId: 'ASM_MID1_CS301_SECA',
      subjectId: 'CS301',
      scoreObtained: 26,
      maxMarks: 30,
      isPassing: true,
      createdAt: '2026-09-21T10:00:00Z'
    }
  ];

  const interventions = [
    {
      id: 'INT001',
      studentId: '24221A0501',
      studentName: 'Adabala sai prasad',
      section: '3rd Year Section A',
      facultyId: 'FAC001',
      facultyName: 'Dr. K. Srinivasa Rao',
      supportType: 'REMEDIAL_CLASS',
      notes: 'Assigned 4 special remedial hours on Syntax Analysis & Lexical Analyzers.',
      followUpDate: '2026-10-25',
      status: 'IN_PROGRESS',
      createdAt: '2026-10-04T11:00:00Z'
    }
  ];

  const announcements = [
    {
      id: 'ANN001',
      title: 'Mid-Term Examinations II Schedule Announced',
      content: 'Mid-2 internal assessments for III B.Tech I Semester CSE commence from November 10th. Attendance condonation guidelines will be strictly enforced.',
      author: 'Dr. V. Rama Krishna, HOD CSE',
      date: '2026-10-08',
      priority: 'HIGH'
    },
    {
      id: 'ANN002',
      title: 'Remedial & Peer Mentoring Sessions for Machine Learning Foundations',
      content: 'Faculty mentoring hour scheduled every Thursday from 4:00 PM to 5:00 PM in Lab 3.',
      author: 'Department Academic Cell',
      date: '2026-10-05',
      priority: 'MEDIUM'
    }
  ];

  const auditLogs = [
    {
      id: 'AUD001',
      timestamp: '2026-10-01T10:35:05Z',
      action: 'ATTENDANCE_MARKED',
      userEmail: 'srinivasarao.k@bvcgroup.in',
      userName: 'Dr. K. Srinivasa Rao',
      role: 'FACULTY',
      details: 'Marked Section A attendance for Compiler Design'
    }
  ];

  const authorizedHods = [];

  return {
    students,
    users,
    feeAccounts,
    riskPredictions,
    subjects,
    faculty,
    teachingAssignments,
    attendanceSessions,
    assessments,
    marks,
    interventions,
    announcements,
    auditLogs,
    authorizedHods,
    otpChallenges: []
  };
}
