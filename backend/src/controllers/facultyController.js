import { store } from '../services/store.js';
import { normalizeSectionName } from '../middleware/auth.js';
import { addStudentSchema, updateStudentSchema, markAttendanceSchema, enterMarksSchema, interventionSchema, createAssessmentSchema } from '../utils/validation.js';
import { StudentAnalyticsService } from '../services/studentAnalyticsService.js';
import { config } from '../config/index.js';

export class FacultyController {
  static async getOverview(req, res) {
    try {
      const requestedSource = req.query.dataSource || (req.query.mode === 'live' ? 'official' : (config.DATA_SOURCE || 'presentation'));
      const dataSource = requestedSource.toLowerCase() === 'official' ? 'official' : 'presentation';
      const threshold = Number(req.query.threshold) || Number(req.query.attThreshold) || 75.0;

      const facultyId = req.user.facultyId;
      const facultyDoc = store.findById('faculty', facultyId) || 
        store.find('faculty', f => f.email === req.user.email || f.facultyId === facultyId || f.id === facultyId)[0];

      // Build assigned classes list
      let assignedClasses = facultyDoc?.assignedClasses || [];
      if (assignedClasses.length === 0) {
        const teaching = store.find('teachingAssignments', ta => ta.facultyId === facultyId || ta.facultyId === facultyDoc?.id);
        if (teaching.length > 0) {
          assignedClasses = teaching.map(t => ({
            section: t.section,
            subjectId: t.subjectId,
            subjectName: t.subjectName || t.subjectId
          }));
        } else if (facultyDoc?.assignedSections?.length > 0) {
          const subId = facultyDoc?.assignedSubjects?.[0] || 'CS301';
          assignedClasses = facultyDoc.assignedSections.map(sec => ({
            section: sec,
            subjectId: subId,
            subjectName: subId === 'CS301' ? 'Compiler Design' : 'Assigned Subject'
          }));
        } else if (req.user.section) {
          assignedClasses = [{
            section: req.user.section,
            subjectId: 'CS301',
            subjectName: 'Compiler Design'
          }];
        }
      }

      // Determine authorized sections for this faculty member
      const isHod = req.user.role === 'HOD';
      const allCseSections = ['3rd Year Section A', '3rd Year Section B', '3rd Year Section C'];
      const rawAssignedSections = assignedClasses.map(ac => normalizeSectionName(ac.section));
      const assignedSections = isHod
        ? allCseSections
        : (rawAssignedSections.length > 0 ? [...new Set(rawAssignedSections)] : allCseSections);

      // Use StudentAnalyticsService to enrich all CSE students with attendance, fees, and No Risk / Risk
      const allEnrichedStudents = StudentAnalyticsService.getEnrichedStudents({
        dataSource,
        threshold,
        section: 'ALL'
      });

      const departmentTotal = allEnrichedStudents.length;

      // Filter to students authorized for this faculty member
      const authorizedStudents = isHod
        ? allEnrichedStudents
        : allEnrichedStudents.filter(s => assignedSections.includes(normalizeSectionName(s.section)));

      const totalStudents = authorizedStudents.length;

      // Calculate attendance cohorts with strict threshold inequality
      const aboveAttendanceStudents = authorizedStudents.filter(s => s.attendancePercentage > threshold);
      const belowAttendanceStudents = authorizedStudents.filter(s => s.attendancePercentage < threshold);
      const exactAttendanceStudents = authorizedStudents.filter(s => s.attendancePercentage === threshold);

      // Calculate fee cohorts
      const feePaidStudents = authorizedStudents.filter(s => s.feeStatus === 'Fully Paid');
      const feeDueStudents = authorizedStudents.filter(s => s.feeStatus === 'Outstanding');
      const totalFeesCollected = authorizedStudents.reduce((acc, s) => acc + (s.amountPaid || 0), 0);
      const totalFeesOutstanding = authorizedStudents.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0);
      const totalFeesExpected = authorizedStudents.reduce((acc, s) => acc + (s.totalSemesterFee || 0), 0);

      // Calculate Risk cohorts (No Risk vs Risk)
      const noRiskStudents = authorizedStudents.filter(s => s.riskCategory === 'No Risk');
      const riskStudents = authorizedStudents.filter(s => s.riskCategory === 'Risk');

      // Low attendance list (< threshold)
      const lowAttendanceStudents = belowAttendanceStudents.map(s => ({
        id: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        section: s.section,
        attendancePercentage: s.attendancePercentage,
        feeStatus: s.feeStatus,
        riskCategory: s.riskCategory
      }));

      // Failing marks list (< 40%)
      const failingStudents = authorizedStudents
        .filter(s => s.internalAvg < 40.0 || s.academicStatus === 'Failing')
        .map(s => ({
          id: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          section: s.section,
          internalAvg: s.internalAvg,
          failedMarksCount: 1,
          failedSubjectNames: ['CS301 (Compiler Design)'],
          feeStatus: s.feeStatus,
          riskCategory: s.riskCategory
        }));

      // At risk students list
      const atRiskStudents = riskStudents.map(s => ({
        id: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        section: s.section,
        riskCategory: s.riskCategory,
        riskStatus: s.riskStatus || 'RISK',
        attendancePercentage: s.attendancePercentage,
        internalAvg: s.internalAvg,
        feeStatus: s.feeStatus,
        outstandingBalance: s.outstandingBalance,
        primaryRiskReason: s.primaryRiskReason || s.riskReasons?.[0] || 'Requires Academic Guidance'
      }));

      // Section-by-section breakdown for all authorized sections
      const sectionBreakdown = assignedSections.map(sec => {
        const inSec = authorizedStudents.filter(s => normalizeSectionName(s.section) === sec);
        const secTotal = inSec.length;
        const secAboveAtt = inSec.filter(s => s.attendancePercentage > threshold).length;
        const secBelowAtt = inSec.filter(s => s.attendancePercentage < threshold).length;
        const secExactAtt = inSec.filter(s => s.attendancePercentage === threshold).length;
        const secFeePaid = inSec.filter(s => s.feeStatus === 'Fully Paid').length;
        const secFeeDue = inSec.filter(s => s.feeStatus === 'Outstanding').length;
        const secNoRisk = inSec.filter(s => s.riskCategory === 'No Risk').length;
        const secRisk = inSec.filter(s => s.riskCategory === 'Risk').length;
        const secFailing = inSec.filter(s => s.internalAvg < 40.0 || s.academicStatus === 'Failing').length;

        const secAvgAtt = secTotal > 0
          ? +(inSec.reduce((acc, s) => acc + s.attendancePercentage, 0) / secTotal).toFixed(1)
          : 0;
        const secAvgMarks = secTotal > 0
          ? +(inSec.reduce((acc, s) => acc + s.internalAvg, 0) / secTotal).toFixed(1)
          : 0;

        return {
          section: sec,
          totalStudents: secTotal,
          averageAttendance: secAvgAtt,
          avgMarks: secAvgMarks,
          aboveThresholdCount: secAboveAtt,
          belowThresholdCount: secBelowAtt,
          exactThresholdCount: secExactAtt,
          lowAttendanceCount: secBelowAtt,
          feePaidCount: secFeePaid,
          feeDueCount: secFeeDue,
          noRiskCount: secNoRisk,
          riskCount: secRisk,
          failingCount: secFailing,
          atRiskCount: secRisk
        };
      });

      // Overall averages
      const averageAttendance = totalStudents > 0
        ? +(authorizedStudents.reduce((acc, s) => acc + s.attendancePercentage, 0) / totalStudents).toFixed(1)
        : 0;
      const averageMarks = totalStudents > 0
        ? +(authorizedStudents.reduce((acc, s) => acc + s.internalAvg, 0) / totalStudents).toFixed(1)
        : 0;

      // Recent attendance sessions
      const recentSessions = store.find('attendanceSessions', sess => 
        sess.facultyId === facultyId || 
        sess.facultyId === facultyDoc?.id ||
        assignedSections.includes(normalizeSectionName(sess.sectionId))
      ).slice(0, 5);

      return res.status(200).json({
        success: true,
        isDemoData: dataSource !== 'official',
        dataSource,
        threshold,
        faculty: {
          name: req.user.name,
          email: req.user.email,
          department: req.user.department || 'CSE',
          designation: facultyDoc?.designation || 'Faculty Member',
          employeeId: facultyDoc?.facultyId || facultyId
        },
        stats: {
          totalAssignedClasses: assignedClasses.length,
          assignedSections,
          totalStudents,
          departmentTotal,
          averageAttendance,
          averageMarks,
          // Attendance summary (>75% vs <75%)
          aboveAttendanceCount: aboveAttendanceStudents.length,
          belowAttendanceCount: belowAttendanceStudents.length,
          exactAttendanceCount: exactAttendanceStudents.length,
          lowAttendanceCount: belowAttendanceStudents.length,
          // Fee payment summary
          feePaidCount: feePaidStudents.length,
          feeDueCount: feeDueStudents.length,
          totalFeesCollected,
          totalFeesOutstanding,
          totalFeesExpected,
          // No Risk vs Risk counts
          noRiskCount: noRiskStudents.length,
          riskCount: riskStudents.length,
          noRiskPercentage: totalStudents > 0 ? +((noRiskStudents.length / totalStudents) * 100).toFixed(1) : 0,
          riskPercentage: totalStudents > 0 ? +((riskStudents.length / totalStudents) * 100).toFixed(1) : 0,
          atRiskCount: riskStudents.length,
          failingCount: failingStudents.length,
          isDemoData: dataSource !== 'official'
        },
        sectionBreakdown,
        lowAttendanceStudents,
        failingStudents,
        atRiskStudents,
        allMonitoredStudents: authorizedStudents,
        assignedClasses,
        recentSessions
      });
    } catch (err) {
      console.error(`[FacultyController getOverview Exception]: ${err.message}`, err.stack);
      return res.status(500).json({
        success: false,
        message: 'Failed to load faculty overview workspace. Please try again.',
        error: err.message
      });
    }
  }

  static async getMyClasses(req, res) {
    const facultyId = req.user.facultyId;
    const facultyDoc = store.findById('faculty', facultyId);
    return res.status(200).json({
      success: true,
      assignedClasses: facultyDoc?.assignedClasses || []
    });
  }

  static async getSectionStudents(req, res) {
    const { sectionName } = req.params;
    const { search, risk, academicRisk, attendance, marks, gender, feeStatus, page = 1, limit = 200, threshold = 75, dataSource: qDataSource } = req.query;
    const configuredThreshold = Number(threshold) || 75.0;

    const isAll = !sectionName || sectionName.toUpperCase() === 'ALL' || sectionName.toLowerCase() === 'all sections';
    const normalizedTarget = normalizeSectionName(sectionName);

    const isLive = req.query.mode === 'live' || qDataSource === 'official';
    const dataSource = isLive ? 'official' : (config.DATA_SOURCE || 'presentation');

    let enriched = StudentAnalyticsService.getEnrichedStudents({
      dataSource,
      threshold: configuredThreshold,
      section: isAll ? 'ALL' : normalizedTarget
    });

    // Filtering
    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(q))
      );
    }
    if (academicRisk && academicRisk !== 'ALL') {
      enriched = enriched.filter(s => s.academicRiskStatus === academicRisk || s.riskStatus === academicRisk);
    }
    if (risk && risk !== 'ALL') {
      enriched = enriched.filter(s => s.riskCategory.toUpperCase() === risk.toUpperCase());
    }
    if (attendance === 'LOW') {
      enriched = enriched.filter(s => s.attendancePercentage < configuredThreshold);
    }
    if (marks === 'LOW') {
      enriched = enriched.filter(s => s.internalAvg < 50.0);
    }
    if (feeStatus === 'DUE') {
      enriched = enriched.filter(s => s.feeStatus !== 'PAID' && s.feeStatus !== 'Fully Paid');
    }

    const total = enriched.length;
    const start = (Number(page) - 1) * Number(limit);
    const paginated = enriched.slice(start, start + Number(limit));

    return res.status(200).json({
      success: true,
      section: isAll ? 'All Sections' : sectionName,
      total,
      students: paginated
    });
  }

  static async getStudentProfile(req, res) {
    const { studentId } = req.params;
    const student = store.findById('students', studentId) || store.find('students', s => s.rollNumber === studentId || s.registrationNumber === studentId)[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Check department authorization: faculty can only view students in their department
    if (student.department !== (req.user.department || 'CSE') && req.user.role !== 'HOD') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Student belongs to another department.' });
    }

    const roll = student.rollNumber || student.registrationNumber;
    const feeAccount = store.findById('feeAccounts', `FEE_${roll}`);
    const riskDoc = store.findById('riskPredictions', `RISK_${roll}`);
    const studentMarks = store.find('marks', m => m.studentId === roll || m.studentId === student.id);
    const allSubjects = store.get('subjects');
    const allAssessments = store.get('assessments');

    // Build assessment history
    const marksHistory = studentMarks.map(m => {
      const asm = allAssessments.find(a => a.id === m.assessmentId);
      const sub = allSubjects.find(s => s.id === m.subjectId);
      return {
        ...m,
        assessmentType: asm?.assessmentType || 'INTERNAL',
        subjectName: sub?.name || m.subjectId,
        conductedBy: asm?.conductedBy || 'Faculty'
      };
    });

    // Attendance history
    const allSessions = store.get('attendanceSessions');
    const sessionHistory = [];
    let presentCount = 0;
    allSessions.forEach(sess => {
      const rec = (sess.records || []).find(r => r.studentId === roll || r.studentId === student.id);
      if (rec) {
        if (rec.status === 'PRESENT' || rec.status === 'ON_DUTY') presentCount++;
        sessionHistory.push({
          sessionId: sess.id,
          sessionDate: sess.sessionDate,
          sessionSlot: sess.sessionSlot,
          subjectName: sess.subjectName,
          facultyName: sess.facultyName,
          status: rec.status
        });
      }
    });

    const totalSessions = sessionHistory.length;
    const computedAttendance = totalSessions > 0
      ? +(Math.round((presentCount / totalSessions) * 1000) / 10).toFixed(1)
      : (student.attendancePercentage ?? 85.0);

    const interventions = store.find('interventions', i => i.studentId === roll || i.studentId === student.id);

    return res.status(200).json({
      success: true,
      student: {
        ...student,
        attendancePercentage: computedAttendance,
        totalSessions,
        presentSessions: presentCount,
        absentSessions: totalSessions - presentCount
      },
      feeAccount,
      riskAssessment: riskDoc || { riskCategory: 'Low', riskScore: 0.1 },
      marksHistory,
      sessionHistory,
      interventions
    });
  }

  static async updateStudent(req, res) {
    try {
      const { studentId } = req.params;
      const parsed = updateStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid student data'
        });
      }

      const student = store.findById('students', studentId) || store.find('students', s => s.rollNumber === studentId || s.registrationNumber === studentId)[0];
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      if (student.department !== (req.user.department || 'CSE') && req.user.role !== 'HOD') {
        return res.status(403).json({ success: false, message: 'Unauthorized: Student belongs to another department.' });
      }

      const updates = { ...parsed.data };
      if (updates.section) {
        updates.section = normalizeSectionName(updates.section);
      }

      const updated = store.update('students', student.id, updates);

      store.logAudit(
        'STUDENT_UPDATED',
        req.user,
        `Updated student record for ${student.name} (${student.id})`
      );

      return res.status(200).json({
        success: true,
        message: `Student details updated successfully for ${student.name}.`,
        student: updated
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async addStudent(req, res) {
    try {
      const parsed = addStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid student data'
        });
      }

      const data = parsed.data;

      // Duplicate check for roll number
      const existingRoll = store.findById('students', data.rollNumber);
      if (existingRoll) {
        return res.status(409).json({
          success: false,
          message: `Student with roll number ${data.rollNumber} already exists.`
        });
      }

      // Duplicate check for email
      const existingEmail = store.findById('users', data.email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: `User with email ${data.email} already exists.`
        });
      }

      const studentDoc = {
        id: data.rollNumber,
        ...data,
        attendancePercentage: 100.0,
        internalAvg: 75.0,
        cgpa: 7.0,
        backlogCount: 0,
        trendScore: 0.0,
        isSynthetic: true,
        dataSource: 'DEMONSTRATION_SYNTHETIC_DATA',
        createdAt: new Date().toISOString()
      };

      store.create('students', studentDoc);

      // Create fee account
      store.create('feeAccounts', {
        id: `FEE_${data.rollNumber}`,
        studentId: data.rollNumber,
        totalSemesterFee: 55000,
        amountPaid: 0,
        outstandingBalance: 55000,
        status: 'OVERDUE',
        dueDate: '2026-11-15',
        history: []
      });

      // Create initial low risk prediction
      store.create('riskPredictions', {
        id: `RISK_${data.rollNumber}`,
        studentId: data.rollNumber,
        rollNumber: data.rollNumber,
        studentName: data.name,
        section: data.section,
        riskScore: 0.1,
        riskCategory: 'Low',
        confidence: 0.9,
        factors: ['Newly enrolled student record initialized.'],
        evaluatedAt: new Date().toISOString(),
        modelUsed: 'Random Forest Classifier (Ensemble)'
      });

      store.logAudit(
        'STUDENT_ENROLLED',
        req.user,
        `Enrolled student ${data.name} (${data.rollNumber}) in ${data.section}`
      );

      return res.status(201).json({
        success: true,
        message: `Student ${data.name} successfully enrolled in ${data.section}.`,
        student: studentDoc
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to add student.'
      });
    }
  }

  static async markAttendance(req, res) {
    try {
      const parsed = markAttendanceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid attendance payload'
        });
      }

      const { sectionId, subjectId, sessionDate, sessionSlot, records } = parsed.data;

      // Duplicate session check
      const existingSession = store.find(
        'attendanceSessions',
        s => s.sectionId === sectionId && s.subjectId === subjectId && s.sessionDate === sessionDate && s.sessionSlot === sessionSlot
      );

      if (existingSession.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Attendance for ${subjectId} in ${sectionId} on ${sessionDate} (${sessionSlot}) has already been recorded.`
        });
      }

      const subject = store.findById('subjects', subjectId);
      const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY').length;
      const absentCount = records.filter(r => r.status === 'ABSENT').length;

      const sessionId = `SESS_${sessionDate.replace(/-/g, '')}_${sectionId.replace(/\s+/g, '')}_${subjectId}`;
      const sessionDoc = {
        id: sessionId,
        sectionId,
        subjectId,
        subjectName: subject?.name || subjectId,
        facultyId: req.user.facultyId,
        facultyName: req.user.name,
        sessionDate,
        sessionSlot,
        presentCount,
        absentCount,
        totalCount: records.length,
        records,
        createdAt: new Date().toISOString()
      };

      store.create('attendanceSessions', sessionDoc);

      // Recompute and update individual student attendance percentages
      records.forEach(r => {
        const student = store.findById('students', r.studentId);
        if (student) {
          const delta = r.status === 'PRESENT' ? 0.3 : -1.8;
          const newAtt = +(Math.min(99.0, Math.max(30.0, student.attendancePercentage + delta))).toFixed(1);
          store.update('students', r.studentId, { attendancePercentage: newAtt });
        }
      });

      store.logAudit(
        'ATTENDANCE_MARKED',
        req.user,
        `Marked attendance for ${sectionId} (${subject?.name || subjectId}) on ${sessionDate}: ${presentCount} Present, ${absentCount} Absent.`
      );

      return res.status(201).json({
        success: true,
        message: `Attendance successfully saved for ${records.length} students.`,
        session: sessionDoc
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Attendance recording failed.'
      });
    }
  }

  static async createAssessment(req, res) {
    try {
      const parsed = createAssessmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid assessment details'
        });
      }

      const { subjectId, sectionId, assessmentType, maxMarks, assessmentDate } = parsed.data;
      const subject = store.findById('subjects', subjectId);

      const asmId = `ASM_${assessmentType}_${subjectId}_${sectionId.replace(/\s+/g, '')}`;
      const asmDoc = {
        id: asmId,
        subjectId,
        subjectName: subject?.name || subjectId,
        sectionId,
        assessmentType,
        maxMarks,
        passingMarks: Math.round(maxMarks * 0.4),
        assessmentDate,
        conductedBy: req.user.name,
        createdAt: new Date().toISOString()
      };

      store.create('assessments', asmDoc);

      return res.status(201).json({
        success: true,
        message: 'Assessment created successfully.',
        assessment: asmDoc
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async enterMarks(req, res) {
    try {
      const parsed = enterMarksSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid marks payload'
        });
      }

      const { assessmentId, subjectId, sectionId, marks } = parsed.data;
      const assessment = store.findById('assessments', assessmentId);
      const maxMarks = assessment?.maxMarks || 30;

      // Validate scores do not exceed max marks
      for (const m of marks) {
        if (m.scoreObtained > maxMarks) {
          return res.status(400).json({
            success: false,
            message: `Score for student ${m.studentId} (${m.scoreObtained}) exceeds maximum allowable marks (${maxMarks}).`
          });
        }
      }

      marks.forEach(m => {
        const markId = `MARK_${m.studentId}_${assessmentId}`;
        const record = {
          id: markId,
          studentId: m.studentId,
          assessmentId,
          subjectId,
          sectionId,
          scoreObtained: m.scoreObtained,
          maxMarks,
          isPassing: m.scoreObtained >= (assessment?.passingMarks || maxMarks * 0.4),
          updatedAt: new Date().toISOString()
        };
        const existing = store.findById('marks', markId);
        if (existing) {
          store.update('marks', markId, record);
        } else {
          store.create('marks', record);
        }
      });

      store.logAudit(
        'MARKS_ENTERED',
        req.user,
        `Recorded marks for ${marks.length} students in ${assessmentId}`
      );

      return res.status(200).json({
        success: true,
        message: `Marks recorded successfully for ${marks.length} students.`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async logIntervention(req, res) {
    try {
      const parsed = interventionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid intervention payload'
        });
      }

      const { studentId, supportType, notes, followUpDate, status } = parsed.data;
      const student = store.findById('students', studentId);

      const interventionDoc = {
        id: `INT_${Date.now()}`,
        studentId,
        studentName: student?.name || studentId,
        section: student?.section || 'Section A',
        facultyId: req.user.facultyId,
        facultyName: req.user.name,
        supportType,
        notes,
        followUpDate,
        status,
        createdAt: new Date().toISOString()
      };

      store.create('interventions', interventionDoc);

      store.logAudit(
        'INTERVENTION_LOGGED',
        req.user,
        `Logged academic support (${supportType}) for ${student?.name || studentId}`
      );

      return res.status(201).json({
        success: true,
        message: 'Academic support intervention recorded.',
        intervention: interventionDoc
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getInterventions(req, res) {
    const list = store.get('interventions');
    return res.status(200).json({
      success: true,
      interventions: list
    });
  }

  static async updateAttendance(req, res) {
    try {
      const { sessionId } = req.params;
      const { records } = req.body;
      const session = store.findById('attendanceSessions', sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Attendance session not found.' });
      }

      if (Array.isArray(records) && records.length > 0) {
        const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY').length;
        const absentCount = records.filter(r => r.status === 'ABSENT').length;
        store.update('attendanceSessions', sessionId, {
          records,
          presentCount,
          absentCount,
          totalCount: records.length,
          correctedBy: req.user.name,
          correctedAt: new Date().toISOString()
        });

        // Recompute individual percentages
        records.forEach(r => {
          const s = store.findById('students', r.studentId);
          if (s) {
            const allSess = store.find('attendanceSessions', sess => 
              (sess.records || []).some(rec => rec.studentId === r.studentId)
            );
            let pres = 0;
            allSess.forEach(sess => {
              const item = sess.records.find(rec => rec.studentId === r.studentId);
              if (item && (item.status === 'PRESENT' || item.status === 'ON_DUTY')) pres++;
            });
            if (allSess.length > 0) {
              const newAtt = +(Math.round((pres / allSess.length) * 1000) / 10).toFixed(1);
              store.update('students', s.id, { attendancePercentage: newAtt });
            }
          }
        });
      }

      store.logAudit(
        'ATTENDANCE_CORRECTED',
        req.user,
        `Corrected attendance for session ${sessionId} (${session.sectionId})`
      );

      return res.status(200).json({
        success: true,
        message: 'Attendance record updated successfully.'
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
