process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/server.js';
import { store } from '../src/services/store.js';
import { EmailOtpService } from '../src/services/emailService.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. Section Composition: Authoritative students (Section A: 49, Section B: 42, Section C: 33, 124 total)', () => {
  const students = store.get('students');
  assert.equal(students.length, 124, 'Total students must be exactly 124');

  const secA = students.filter(s => s.section === '3rd Year Section A');
  const secB = students.filter(s => s.section === '3rd Year Section B');
  const secC = students.filter(s => s.section === '3rd Year Section C');

  assert.equal(secA.length, 49, '3rd Year Section A must have exactly 49 students');
  assert.equal(secB.length, 42, '3rd Year Section B must have exactly 42 students');
  assert.equal(secC.length, 33, '3rd Year Section C must have exactly 33 students');

  // Verify only name and registration number are stored
  students.forEach(s => {
    assert.ok(s.registrationNumber || s.rollNumber, 'Student must have registrationNumber');
    assert.ok(s.name, 'Student must have name');
  });
});

test('2. College Email Restriction: Accepts @bvcgroup.in and rejects non-college emails', async () => {
  // Invalid domain
  const resInvalid = await fetch(`${baseUrl}/api/v1/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@gmail.com', purpose: 'REGISTRATION' })
  });
  assert.equal(resInvalid.status, 400);
  const dataInvalid = await resInvalid.json();
  assert.equal(dataInvalid.success, false);
  assert.match(dataInvalid.message, /bvcgroup\.in/);

  // Valid college domain
  const resValid = await fetch(`${baseUrl}/api/v1/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'newstudent@bvcgroup.in', purpose: 'REGISTRATION' })
  });
  assert.equal(resValid.status, 200);
  const dataValid = await resValid.json();
  assert.equal(dataValid.success, true);
});

test('3. OTP Verification: Rejects incorrect OTP and accepts valid OTP', async () => {
  const testEmail = 'verifytest@bvcgroup.in';
  await EmailOtpService.createAndSendOtp(testEmail, 'REGISTRATION');

  // Incorrect OTP
  const wrongVerify = EmailOtpService.verifyOtp(testEmail, '000000');
  assert.equal(wrongVerify.success, false);

  // Correct OTP
  const challenge = store.findById('otpChallenges', testEmail);
  assert.ok(challenge);
  const rawOtp = EmailOtpService.generateOtp();
  const hash = EmailOtpService.hashOtp(rawOtp);
  store.update('otpChallenges', testEmail, { otpHash: hash, attempts: 0 });

  const correctVerify = EmailOtpService.verifyOtp(testEmail, rawOtp);
  assert.equal(correctVerify.success, true);
});

test('4. HOD & Faculty Registration (No Secret Field, No Directory Restriction, Anti-Escalation)', async () => {
  // A. Enrolled student attempting privilege escalation to HOD is rejected with 403
  const escalationRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Adabala sai prasad',
      email: '24221a0501@bvcgroup.in',
      password: 'Password@123',
      role: 'HOD',
      employeeId: 'HOD_ESCALATE_01'
    })
  });
  assert.equal(escalationRes.status, 403);
  const escalationData = await escalationRes.json();
  assert.match(escalationData.message, /Enrolled students cannot register as Head of Department/i);

  // B. HOD registration without Employee ID is rejected with 400
  const missingEmpRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. No Employee ID',
      email: 'new_hod_no_empid@bvcgroup.in',
      password: 'Password@123',
      role: 'HOD',
      employeeId: ''
    })
  });
  assert.equal(missingEmpRes.status, 400);

  // C. Institutional user registers as HOD without administrative secret and without directory allowlist
  const hodRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Brand New HOD',
      email: 'brandnew_hod@bvcgroup.in',
      password: 'Password@123',
      role: 'HOD',
      employeeId: 'HOD_CSE_NEW',
      cabin: 'Block B - Room 201'
    })
  });
  assert.equal(hodRes.status, 201);
  const hodData = await hodRes.json();
  assert.equal(hodData.success, true);
  assert.equal(hodData.requiresVerification, true);
  
  // Directly approved in store without requiring second approval
  const hodUserDoc = store.findById('users', 'brandnew_hod@bvcgroup.in');
  assert.equal(hodUserDoc.isApproved, true);
  assert.equal(hodUserDoc.approvalStatus, 'APPROVED');

  // Verify OTP activates account
  const rawOtp = EmailOtpService.generateOtp();
  const hash = EmailOtpService.hashOtp(rawOtp);
  store.update('otpChallenges', 'brandnew_hod@bvcgroup.in', { otpHash: hash, attempts: 0 });

  const verifyRes = await fetch(`${baseUrl}/api/v1/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'brandnew_hod@bvcgroup.in',
      otp: rawOtp
    })
  });
  assert.equal(verifyRes.status, 200);

  // HOD logs in directly without approval block
  const hodLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'brandnew_hod@bvcgroup.in',
      password: 'Password@123'
    })
  });
  assert.equal(hodLoginRes.status, 200);
  const hodLoginData = await hodLoginRes.json();
  assert.equal(hodLoginData.success, true);
  assert.equal(hodLoginData.user.role, 'HOD');
  assert.ok(hodLoginData.token);

  // HOD token grants access to HOD overview endpoint
  const hodOverviewRes = await fetch(`${baseUrl}/api/v1/hod/overview`, {
    headers: { Authorization: `Bearer ${hodLoginData.token}` }
  });
  assert.equal(hodOverviewRes.status, 200);

  // C. Faculty registration succeeds without invitation code and is directly approved
  const facRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Prof. Auto Approved',
      email: 'auto_faculty@bvcgroup.in',
      password: 'Password@123',
      role: 'FACULTY',
      designation: 'Associate Professor',
      employeeId: 'FAC_AUTO_01',
      assignedSection: '3rd Year Section B',
      assignedSubject: 'CS302'
    })
  });
  assert.equal(facRes.status, 201);
  const facData = await facRes.json();
  assert.equal(facData.success, true);
  assert.equal(facData.requiresVerification, true);

  // Directly approved in store without requiring HOD approval
  const facUserDoc = store.findById('users', 'auto_faculty@bvcgroup.in');
  assert.equal(facUserDoc.isApproved, true);
  assert.equal(facUserDoc.approvalStatus, 'APPROVED');

  // Mark verified and log in directly
  store.update('users', 'auto_faculty@bvcgroup.in', { isVerified: true });

  const facLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'auto_faculty@bvcgroup.in',
      password: 'Password@123'
    })
  });
  assert.equal(facLoginRes.status, 200);
  const facLoginData = await facLoginRes.json();
  assert.equal(facLoginData.success, true);
  assert.equal(facLoginData.user.role, 'FACULTY');
});

test('5. RBAC Guards: Student account cannot access faculty or HOD endpoints', async () => {
  // Login as student with valid credentials
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '22221a0501@bvcgroup.in', password: 'Bvc@2026' })
  });
  const loginData = await loginRes.json();
  assert.equal(loginData.success, true);
  const token = loginData.token;

  // Attempt to access HOD overview
  const hodRes = await fetch(`${baseUrl}/api/v1/hod/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(hodRes.status, 403);

  // Attempt to mark attendance
  const attRes = await fetch(`${baseUrl}/api/v1/faculty/attendance`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sectionId: '3rd Year Section A' })
  });
  assert.equal(attRes.status, 403);
});

test('6. Faculty Access: Can view all 124 CSE students across sections, but cannot modify unassigned section', async () => {
  // Login as Dr. K. Srinivasa Rao (assigned to Section A & B)
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'srinivasarao.k@bvcgroup.in', password: 'Bvc@2026' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // 1. View all CSE students across all sections (GET /faculty/students) -> returns all 124 students
  const allRes = await fetch(`${baseUrl}/api/v1/faculty/students`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(allRes.status, 200);
  const allData = await allRes.json();
  assert.equal(allData.total, 124, 'Faculty must see all 124 CSE students across sections');

  // 2. View students of Section C (GET /faculty/sections/Section C/students) -> Allowed for CSE faculty reading roster
  const secCRes = await fetch(`${baseUrl}/api/v1/faculty/sections/3rd%20Year%20Section%20C/students`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(secCRes.status, 200);
  const secCData = await secCRes.json();
  assert.equal(secCData.total, 33);

  // 3. Modification (POST /faculty/attendance) for unassigned Section C -> Denied (403)
  const modifyUnassigned = await fetch(`${baseUrl}/api/v1/faculty/attendance`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subjectId: 'CS301',
      sectionId: '3rd Year Section C',
      date: '2026-10-15',
      sessionType: 'THEORY',
      periodNumber: 1,
      records: [{ studentId: '24221A0582', status: 'PRESENT' }]
    })
  });
  assert.equal(modifyUnassigned.status, 403);
  const modifyData = await modifyUnassigned.json();
  assert.match(modifyData.message, /teaching permissions/i);
});

test('7. Faculty Student Management: Profile Retrieval & Update Persistence', async () => {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'srinivasarao.k@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token } = await loginRes.json();

  // 1. Get student profile for 24221A0501
  const profRes = await fetch(`${baseUrl}/api/v1/faculty/students/24221A0501`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(profRes.status, 200);
  const profData = await profRes.json();
  assert.equal(profData.success, true);
  assert.equal(profData.student.registrationNumber, '24221A0501');
  assert.ok(Array.isArray(profData.sessionHistory));
  assert.ok(Array.isArray(profData.marksHistory));

  // 2. Update student details
  const updateRes = await fetch(`${baseUrl}/api/v1/faculty/students/24221A0501`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Adabala Sai Prasad (Updated)',
      academicYear: '3rd Year'
    })
  });
  assert.equal(updateRes.status, 200);
  const updateData = await updateRes.json();
  assert.equal(updateData.success, true);
  assert.equal(updateData.student.name, 'Adabala Sai Prasad (Updated)');

  // Verify persistence in store
  const storedStudent = store.findById('students', '24221A0501');
  assert.equal(storedStudent.name, 'Adabala Sai Prasad (Updated)');
});

test('8. Student Semester Marks: Active 3-1 Returns Real Data, Unreleased Semesters Return "Results Not Available"', async () => {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '22221a0501@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token } = await loginRes.json();

  // A. Query ALL semesters
  const allSemRes = await fetch(`${baseUrl}/api/v1/students/marks?semester=ALL`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(allSemRes.status, 200);
  const allSemData = await allSemRes.json();
  assert.equal(allSemData.success, true);
  assert.ok(allSemData.semestersMap['3-1'], 'Semester 3-1 must be present');
  assert.ok(allSemData.semestersMap['1-1'], 'Semester 1-1 must be present');
  assert.equal(allSemData.semestersMap['1-1'].resultsAvailable, false);
  assert.match(allSemData.semestersMap['1-1'].message, /Results not available/i);

  // B. Query active 3-1
  const sem31Res = await fetch(`${baseUrl}/api/v1/students/marks?semester=3-1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(sem31Res.status, 200);
  const sem31Data = await sem31Res.json();
  assert.equal(sem31Data.semester, '3-1');
  assert.equal(sem31Data.resultsAvailable, true);
  assert.ok(sem31Data.subjectWise.length > 0);

  // C. Query unreleased semester 2-1
  const sem21Res = await fetch(`${baseUrl}/api/v1/students/marks?semester=2-1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(sem21Res.status, 200);
  const sem21Data = await sem21Res.json();
  assert.equal(sem21Data.semester, '2-1');
  assert.equal(sem21Data.resultsAvailable, false);
  assert.match(sem21Data.message, /Results not available/i);
});

test('9. Student Attendance: Weekly Breakdown Structure & Session Percentages', async () => {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '22221a0501@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token } = await loginRes.json();

  const attRes = await fetch(`${baseUrl}/api/v1/students/attendance`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(attRes.status, 200);
  const attData = await attRes.json();
  assert.equal(attData.success, true);
  assert.ok(Array.isArray(attData.weeklyBreakdown), 'Must contain weeklyBreakdown array');
  assert.ok(attData.weeklyBreakdown.length > 0);

  const firstWeek = attData.weeklyBreakdown[0];
  assert.ok('weekNumber' in firstWeek);
  assert.ok('dateRange' in firstWeek);
  assert.ok('eligibleSessions' in firstWeek);
  assert.ok('presentSessions' in firstWeek);
  assert.ok('absentSessions' in firstWeek);
  assert.ok('weeklyPercentage' in firstWeek);
  assert.equal(firstWeek.eligibleSessions, firstWeek.presentSessions + firstWeek.absentSessions);
});

test('10. 4-Tier Student Risk Analytics: Clear Stratification & Configurable Threshold', async () => {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'srinivasarao.k@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token } = await loginRes.json();

  const riskRes = await fetch(`${baseUrl}/api/v1/analytics/risk-distribution?threshold=75`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(riskRes.status, 200);
  const riskData = await riskRes.json();
  assert.equal(riskData.success, true);
  assert.equal(riskData.configuredThreshold, 75);

  // Check 4 categories
  const cats = riskData.categories;
  assert.ok(Array.isArray(cats.academicallyAtRisk));
  assert.ok(Array.isArray(cats.attendanceAtRisk));
  assert.ok(Array.isArray(cats.combinedRisk));
  assert.ok(Array.isArray(cats.healthy));

  // Check summary counts
  const sum = riskData.summary;
  assert.equal(sum.totalEvaluated, 124);
  assert.equal(sum.totalEvaluated, cats.academicallyAtRisk.length + cats.attendanceAtRisk.length + cats.combinedRisk.length + cats.healthy.length);

  // Check that students have both confirmed record and ML prediction
  const sample = cats.healthy[0] || cats.attendanceAtRisk[0];
  assert.ok(sample);
  assert.ok('actualAttendancePercentage' in sample);
  assert.ok('internalAvg' in sample);
  assert.ok('mlPrediction' in sample);
  assert.ok(sample.mlPrediction.modelUsed.includes('Random Forest'));
});

test('11. Marks Management: Rejects scores exceeding assessment max marks', async () => {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'srinivasarao.k@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token } = await loginRes.json();

  const invalidMarksRes = await fetch(`${baseUrl}/api/v1/faculty/marks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assessmentId: 'ASM_MID1_CS301_SECA',
      subjectId: 'CS301',
      sectionId: '3rd Year Section A',
      marks: [
        { studentId: '24221A0501', scoreObtained: 35 } // Max is 30!
      ]
    })
  });
  assert.equal(invalidMarksRes.status, 400);
  const invalidData = await invalidMarksRes.json();
  assert.match(invalidData.message, /exceeds maximum allowable marks/);
});

test('12. Fee Balance Calculation: Balance = Total Fee - Amount Paid', () => {
  const feeDocs = store.get('feeAccounts');
  assert.ok(feeDocs.length > 0);
  feeDocs.forEach(f => {
    assert.equal(f.outstandingBalance, f.totalSemesterFee - f.amountPaid);
  });
});

test('13. Faculty Overview: Loads real authoritative data, section breakdown, and metrics without hanging', async () => {
  // Login as Dr. K. Srinivasa Rao
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'srinivasarao.k@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token, user } = await loginRes.json();
  assert.equal(user.role, 'FACULTY');

  // A. Demo / Presentation Mode (default)
  const overviewRes = await fetch(`${baseUrl}/api/v1/faculty/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(overviewRes.status, 200);
  const data = await overviewRes.json();
  assert.equal(data.success, true);
  assert.ok(data.stats);
  assert.ok(data.stats.totalStudents > 0);
  assert.equal(data.stats.departmentTotal, 124);
  assert.ok(data.stats.averageAttendance > 0);
  assert.ok(Array.isArray(data.sectionBreakdown));
  assert.ok(data.sectionBreakdown.length > 0);
  assert.ok(Array.isArray(data.lowAttendanceStudents));
  assert.ok(Array.isArray(data.failingStudents));
  assert.ok(Array.isArray(data.atRiskStudents));

  // Verify 80/20 metrics and No Risk / Risk terminology
  assert.ok(data.stats.noRiskCount > 0);
  assert.ok(data.stats.riskCount > 0);
  assert.ok(data.stats.aboveAttendanceCount > 0);
  assert.ok(data.stats.feePaidCount > 0);

  // Each section should adhere to ~80% No Risk / ~20% Risk
  data.sectionBreakdown.forEach(sec => {
    assert.ok(sec.noRiskCount >= sec.riskCount);
    assert.ok(sec.aboveThresholdCount >= sec.belowThresholdCount);
    assert.ok(sec.feePaidCount >= sec.feeDueCount);
  });

  // B. Live / Official Mode
  const liveRes = await fetch(`${baseUrl}/api/v1/faculty/overview?mode=live`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(liveRes.status, 200);
  const liveData = await liveRes.json();
  assert.equal(liveData.success, true);
  assert.equal(liveData.isDemoData, false);
});

test('14. HOD Dashboard: Dynamic HOD Name, 80/20 Demo Target Distribution, and Student Profile Access', async () => {
  // Login as Jami verendra (HOD)
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '24221a1226@bvcgroup.in', password: 'Bvc@2026' })
  });
  assert.equal(loginRes.status, 200);
  const { token, user } = await loginRes.json();
  assert.equal(user.name, 'Jami verendra');
  assert.equal(user.role, 'HOD');

  // A. Live mode overview
  const liveRes = await fetch(`${baseUrl}/api/v1/hod/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(liveRes.status, 200);
  const liveData = await liveRes.json();
  assert.equal(liveData.success, true);
  assert.equal(liveData.hodName, 'Jami verendra');
  assert.equal(liveData.stats.totalStudents, 124);

  // B. Demo mode overview (80% Positive / 20% Negative target)
  const demoRes = await fetch(`${baseUrl}/api/v1/hod/overview?mode=demo`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(demoRes.status, 200);
  const demoData = await demoRes.json();
  assert.equal(demoData.success, true);
  assert.equal(demoData.isDemoMode, true);
  assert.equal(demoData.targetDistribution.positiveTotal, 99);
  assert.equal(demoData.targetDistribution.negativeTotal, 25);

  const secA = demoData.sectionStats.find(s => s.section.includes('Section A'));
  const secB = demoData.sectionStats.find(s => s.section.includes('Section B'));
  const secC = demoData.sectionStats.find(s => s.section.includes('Section C'));
  assert.equal(secA.positiveCount, 39);
  assert.equal(secA.negativeCount, 10);
  assert.equal(secB.positiveCount, 34);
  assert.equal(secB.negativeCount, 8);
  assert.equal(secC.positiveCount, 26);
  assert.equal(secC.negativeCount, 7);

  // C. Access full student profile via /api/v1/hod/students/:studentId
  const studRes = await fetch(`${baseUrl}/api/v1/hod/students/24221A0501`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(studRes.status, 200);
  const studData = await studRes.json();
  assert.equal(studData.success, true);
  assert.equal(studData.student.rollNumber, '24221A0501');
  assert.ok(studData.marksHistory);
  assert.ok(studData.sessionHistory);
});

test('15. HOD Operations: Delete Teaching Assignment and Remove Faculty with Historical Record Preservation', async () => {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '24221a1226@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token } = await loginRes.json();

  // A. Delete teaching assignment TA001
  const delAsmRes = await fetch(`${baseUrl}/api/v1/hod/assignments/TA001`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(delAsmRes.status, 200);
  const delAsmData = await delAsmRes.json();
  assert.equal(delAsmData.success, true);

  // Verify TA001 is removed
  assert.equal(store.findById('teachingAssignments', 'TA001'), null);

  // B. Remove faculty FAC003 (Mr. M. Vamsi Krishna)
  const remFacRes = await fetch(`${baseUrl}/api/v1/hod/faculty/FAC003`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(remFacRes.status, 200);
  const remFacData = await remFacRes.json();
  assert.equal(remFacData.success, true);

  // Verify faculty is deactivated and marked removed, but student historical marks remain
  const facDoc = store.findById('faculty', 'FAC003');
  assert.equal(facDoc.isActive, false);
  assert.equal(facDoc.isRemoved, true);
  assert.equal(facDoc.assignedClasses.length, 0);

  // Verify historical marks in store are untouched
  const marks = store.get('marks');
  assert.ok(marks.length > 0, 'Historical student assessment marks must be preserved');
});

test('16. Report Export: Authoritative Signoff and Zero Gender References', async () => {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '24221a1226@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token } = await loginRes.json();

  const reportRes = await fetch(`${baseUrl}/api/v1/hod/reports?reportType=DIRECTORY&section=ALL`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(reportRes.status, 200);
  const reportData = await reportRes.json();
  assert.equal(reportData.success, true);
  assert.equal(reportData.authorName, 'Jami verendra');
  assert.ok(!reportData.csvContent.toLowerCase().includes('gender'), 'Report CSV must not contain Gender column');
});

test('17. Section-Wise Export Reports: Strict Attendance, Fee, and No Risk / Risk Sub-Filters', async () => {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '24221a1226@bvcgroup.in', password: 'Bvc@2026' })
  });
  const { token } = await loginRes.json();

  // A. Section A Attendance Above 75%
  const attAboveRes = await fetch(`${baseUrl}/api/v1/hod/reports?reportType=ATTENDANCE&section=3rd%20Year%20Section%20A&subFilter=ABOVE_75`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(attAboveRes.status, 200);
  const attAboveData = await attAboveRes.json();
  assert.equal(attAboveData.totalRecords, 39);
  attAboveData.students.forEach(s => {
    assert.ok(s.attendancePercentage > 75.0, 'Student attendance must be strictly > 75%');
  });

  // B. Section A Attendance Below 75%
  const attBelowRes = await fetch(`${baseUrl}/api/v1/hod/reports?reportType=ATTENDANCE&section=3rd%20Year%20Section%20A&subFilter=BELOW_75`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(attBelowRes.status, 200);
  const attBelowData = await attBelowRes.json();
  assert.equal(attBelowData.totalRecords, 10);
  attBelowData.students.forEach(s => {
    assert.ok(s.attendancePercentage < 75.0, 'Student attendance must be strictly < 75%');
  });

  // C. Section B Fee Status Fully Paid
  const feePaidRes = await fetch(`${baseUrl}/api/v1/hod/reports?reportType=FEES&section=3rd%20Year%20Section%20B&subFilter=PAID`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(feePaidRes.status, 200);
  const feePaidData = await feePaidRes.json();
  assert.equal(feePaidData.totalRecords, 34);
  feePaidData.students.forEach(s => {
    assert.equal(s.feeStatus, 'Fully Paid');
    assert.equal(s.outstandingBalance, 0);
  });

  // D. Section B Fee Status Outstanding
  const feeDueRes = await fetch(`${baseUrl}/api/v1/hod/reports?reportType=FEES&section=3rd%20Year%20Section%20B&subFilter=OUTSTANDING`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(feeDueRes.status, 200);
  const feeDueData = await feeDueRes.json();
  assert.equal(feeDueData.totalRecords, 8);
  feeDueData.students.forEach(s => {
    assert.equal(s.feeStatus, 'Outstanding');
    assert.ok(s.outstandingBalance > 0);
  });

  // E. Section C Academic Risk: No Risk vs Risk
  const noRiskRes = await fetch(`${baseUrl}/api/v1/hod/reports?reportType=ACADEMIC_RISK&section=3rd%20Year%20Section%20C&subFilter=NO_RISK`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(noRiskRes.status, 200);
  const noRiskData = await noRiskRes.json();
  assert.equal(noRiskData.totalRecords, 26);
  noRiskData.students.forEach(s => {
    assert.equal(s.riskCategory, 'No Risk');
  });

  const riskRes = await fetch(`${baseUrl}/api/v1/hod/reports?reportType=ACADEMIC_RISK&section=3rd%20Year%20Section%20C&subFilter=RISK`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(riskRes.status, 200);
  const riskData = await riskRes.json();
  assert.equal(riskData.totalRecords, 7);
  riskData.students.forEach(s => {
    assert.equal(s.riskCategory, 'Risk');
    assert.ok(s.primaryRiskReason, 'Risk student must have reason explained');
  });
});
