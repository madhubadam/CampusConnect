import { store } from './store.js';
import { normalizeSectionName } from '../middleware/auth.js';

/**
 * Service providing unified, student-based 80/20 presentation & official analytics.
 * Preserves the actual 124 CSE students (Sections A: 49, B: 42, C: 33) with their
 * real names and roll numbers, dynamically computing section rollups, attendance
 * distributions, fee collection standing, and No Risk / Risk classifications.
 */
export class StudentAnalyticsService {
  /**
   * Returns presentation target counts per section ensuring ~80% No Risk / ~20% Risk,
   * ~80% Above 75% Attendance / ~20% Below 75% Attendance, and ~80% Paid / ~20% Outstanding Fees.
   */
  static getSectionTargets(sectionName, totalCount) {
    if (sectionName.includes('Section A')) {
      return { total: 49, noRisk: 39, risk: 10, attAbove: 39, attBelow: 10, feePaid: 32, feeDue: 17 };
    }
    if (sectionName.includes('Section B')) {
      return { total: 42, noRisk: 34, risk: 8, attAbove: 34, attBelow: 8, feePaid: 34, feeDue: 8 };
    }
    if (sectionName.includes('Section C')) {
      return { total: 33, noRisk: 26, risk: 7, attAbove: 26, attBelow: 7, feePaid: 26, feeDue: 7 };
    }
    const noRisk = Math.round(totalCount * 0.8);
    const risk = totalCount - noRisk;
    return { total: totalCount, noRisk, risk, attAbove: noRisk, attBelow: risk, feePaid: Math.round(totalCount * 0.7), feeDue: totalCount - Math.round(totalCount * 0.7) };
  }

  /**
   * Retrieves all students enriched with attendance, fees, and academic risk metrics.
   * Can produce either presentation dataset (synthetic realistic 80/20 scenario mapped
   * to real student identities) or official records.
   */
  static getEnrichedStudents({ dataSource = 'presentation', threshold = 75.0, section = 'ALL' } = {}) {
    const configuredThreshold = Number(threshold) || 75.0;
    const allStudents = store.get('students').filter(s => s.department === 'CSE');
    const isPresentation = dataSource !== 'official';

    const feeMap = new Map(store.get('feeAccounts').map(f => [f.studentId, f]));
    const sessions = store.get('attendanceSessions');
    const marks = store.get('marks');

    // Group students by section
    const studentsBySection = {
      '3rd Year Section A': [],
      '3rd Year Section B': [],
      '3rd Year Section C': []
    };

    allStudents.forEach(s => {
      const sec = s.section || '3rd Year Section A';
      if (studentsBySection[sec]) {
        studentsBySection[sec].push(s);
      } else {
        studentsBySection['3rd Year Section A'].push(s);
      }
    });

    const enriched = [];

    // Process each section
    for (const [secName, sectionStudents] of Object.entries(studentsBySection)) {
      const secTarget = this.getSectionTargets(secName, sectionStudents.length);

      sectionStudents.forEach((s, idx) => {
        const roll = s.rollNumber || s.registrationNumber;

        let attendancePercentage = 85.0;
        let internalAvg = 72.0;
        let feeStatus = 'Fully Paid';
        let totalFee = 55000;
        let amountPaid = 55000;
        let outstandingBalance = 0;
        let academicStatus = 'Passing';
        let riskCategory = 'No Risk';
        let riskStatus = 'NO_RISK';
        let riskReasons = [];
        let riskType = 'NONE'; // 'NONE' | 'ATTENDANCE' | 'ACADEMIC' | 'COMBINED'

        if (isPresentation) {
          // Attendance & academic risk targets
          if (idx < secTarget.noRisk) {
            attendancePercentage = +(80.0 + ((idx * 3.7) % 15.0)).toFixed(1); // strictly > 75% (80.0% to 94.9%)
            internalAvg = +(62.0 + ((idx * 4.3) % 26.0)).toFixed(1); // passing internal evaluation marks
            academicStatus = 'Passing';
            riskCategory = 'No Risk';
            riskStatus = 'NO_RISK';
            riskType = 'NONE';
            riskReasons = ['Meets all configured attendance and academic performance standards.'];
          } else {
            const riskIdx = idx - secTarget.noRisk;
            riskCategory = 'Risk';
            attendancePercentage = +(56.0 + ((riskIdx * 1.5) % 15.0)).toFixed(1); // strictly < 75% (56.0% to 69.5%)

            // Transparent stratified risk reasons:
            if (riskIdx < 4) {
              // Low Attendance only (Passing marks)
              internalAvg = +(62.0 + ((riskIdx * 3.1) % 15.0)).toFixed(1);
              academicStatus = 'Passing';
              riskStatus = 'ATTENDANCE_RISK';
              riskType = 'ATTENDANCE';
              riskReasons = [
                `Attendance at ${attendancePercentage}% is below mandatory ${configuredThreshold}% threshold.`
              ];
            } else if (riskIdx < 7) {
              // Low Marks only (Failing marks < 40%)
              internalAvg = +(32.0 + ((riskIdx * 2.2) % 6.0)).toFixed(1);
              academicStatus = 'Failing';
              riskStatus = 'ACADEMIC_RISK';
              riskType = 'ACADEMIC';
              riskReasons = [
                `Internal continuous evaluation average of ${internalAvg}% is below 40% passing standard.`,
                `Attendance at ${attendancePercentage}% is below mandatory ${configuredThreshold}% threshold.`
              ];
            } else {
              // Combined Risk (low attendance + low marks)
              internalAvg = +(28.0 + ((riskIdx * 2.5) % 8.0)).toFixed(1);
              academicStatus = 'Failing';
              riskStatus = 'COMBINED_RISK';
              riskType = 'COMBINED';
              riskReasons = [
                `Combined risk: Attendance (${attendancePercentage}%) and internal assessment average (${internalAvg}%) below institutional benchmarks.`
              ];
            }
          }

          // Fee status determination:
          // For Section A, preserve the actual 32 paid / 17 due from authentic fee accounts
          // For other sections, adhere strictly to secTarget.feePaid / secTarget.feeDue
          const feeAcc = feeMap.get(roll);
          if (secName.includes('Section A') && feeAcc) {
            totalFee = feeAcc.totalSemesterFee || 55000;
            amountPaid = feeAcc.amountPaid || 0;
            outstandingBalance = feeAcc.outstandingBalance || 0;
            feeStatus = (outstandingBalance === 0 && amountPaid > 0) ? 'Fully Paid' : 'Outstanding';
          } else {
            if (idx < secTarget.feePaid) {
              totalFee = 55000;
              amountPaid = 55000;
              outstandingBalance = 0;
              feeStatus = 'Fully Paid';
            } else {
              totalFee = 55000;
              amountPaid = 35000;
              outstandingBalance = 20000;
              feeStatus = 'Outstanding';
            }
          }

          if (feeStatus === 'Outstanding') {
            riskReasons.push(`Outstanding semester fee balance of ₹${outstandingBalance.toLocaleString('en-IN')}.`);
          }
        } else {
          // Official records calculation
          const feeAcc = feeMap.get(roll);
          if (feeAcc) {
            totalFee = feeAcc.totalSemesterFee || 55000;
            amountPaid = feeAcc.amountPaid || 0;
            outstandingBalance = feeAcc.outstandingBalance || 0;
            feeStatus = (outstandingBalance === 0 && amountPaid > 0) ? 'Fully Paid' : 'Outstanding';
          }

          // Calculate actual attendance from sessions if available
          const studentSessions = sessions.filter(sess =>
            (sess.records || []).some(r => r.studentId === roll || r.studentId === s.id)
          );
          if (studentSessions.length > 0) {
            let presentCount = 0;
            studentSessions.forEach(sess => {
              const rec = sess.records.find(r => r.studentId === roll || r.studentId === s.id);
              if (rec && (rec.status === 'PRESENT' || rec.status === 'ON_DUTY')) presentCount++;
            });
            attendancePercentage = +(Math.round((presentCount / studentSessions.length) * 1000) / 10).toFixed(1);
          } else {
            attendancePercentage = s.attendancePercentage ?? 85.0;
          }

          internalAvg = s.internalAvg ?? 75.0;
          academicStatus = internalAvg < 40.0 ? 'Failing' : 'Passing';

          const hasAttRisk = attendancePercentage < configuredThreshold;
          const hasAcadRisk = internalAvg < 40.0;
          const hasFeeRisk = feeStatus === 'Outstanding';

          if (hasAttRisk || hasAcadRisk) {
            riskCategory = 'Risk';
            if (hasAttRisk && hasAcadRisk) {
              riskStatus = 'COMBINED_RISK';
              riskType = 'COMBINED';
              riskReasons.push(`Attendance at ${attendancePercentage}% is below ${configuredThreshold}% cutoff.`);
              riskReasons.push(`Internal score average (${internalAvg}%) is below 40% passing standard.`);
            } else if (hasAttRisk) {
              riskStatus = 'ATTENDANCE_RISK';
              riskType = 'ATTENDANCE';
              riskReasons.push(`Attendance at ${attendancePercentage}% is below ${configuredThreshold}% cutoff.`);
            } else {
              riskStatus = 'ACADEMIC_RISK';
              riskType = 'ACADEMIC';
              riskReasons.push(`Internal score average (${internalAvg}%) is below 40% passing standard.`);
            }
          } else {
            riskCategory = 'No Risk';
            riskStatus = 'NO_RISK';
            riskType = 'NONE';
            riskReasons.push('Meets academic standing and attendance criteria.');
          }

          if (hasFeeRisk) {
            riskReasons.push(`Outstanding fee balance of ₹${outstandingBalance.toLocaleString('en-IN')}.`);
          }
        }

        // Attendance category with strict threshold evaluation
        let attendanceCategory = 'Attendance Above 75%';
        if (attendancePercentage > configuredThreshold) {
          attendanceCategory = `Attendance Above ${configuredThreshold}%`;
        } else if (attendancePercentage < configuredThreshold) {
          attendanceCategory = `Attendance Below ${configuredThreshold}%`;
        } else {
          attendanceCategory = `Attendance Exactly ${configuredThreshold}%`;
        }

        enriched.push({
          id: s.id || roll,
          rollNumber: roll,
          registrationNumber: roll,
          name: s.name,
          section: secName,
          department: s.department || 'CSE',
          academicYear: s.academicYear || '3rd Year',
          attendancePercentage,
          attendanceCategory,
          attendanceThreshold: configuredThreshold,
          totalSemesterFee: totalFee,
          amountPaid,
          outstandingBalance,
          feeBalance: outstandingBalance,
          feeStatus,
          internalAvg,
          cgpa: s.cgpa ?? 7.5,
          academicStatus,
          riskCategory, // 'No Risk' | 'Risk'
          riskStatus,
          academicRiskStatus: riskStatus,
          riskType,
          riskScore: riskCategory === 'Risk' ? (riskStatus === 'COMBINED_RISK' ? 0.88 : (riskStatus === 'ACADEMIC_RISK' ? 0.55 : 0.48)) : 0.12,
          riskFactors: riskReasons,
          riskReasons,
          primaryRiskReason: riskReasons[0] || 'Satisfactory standing',
          isDemoData: isPresentation
        });
      });
    }

    if (section && section !== 'ALL') {
      const targetSec = normalizeSectionName(section);
      return enriched.filter(s => normalizeSectionName(s.section) === targetSec || s.section === section);
    }

    return enriched;
  }

  /**
   * Calculates comprehensive departmental summary and section comparisons.
   */
  static getDepartmentMetrics({ dataSource = 'presentation', threshold = 75.0 } = {}) {
    const configuredThreshold = Number(threshold) || 75.0;
    const students = this.getEnrichedStudents({ dataSource, threshold: configuredThreshold, section: 'ALL' });
    const faculty = store.get('faculty').filter(f => !f.isRemoved);
    const subjects = store.get('subjects');
    const assignments = store.get('teachingAssignments');

    const sections = ['3rd Year Section A', '3rd Year Section B', '3rd Year Section C'];

    const sectionStats = sections.map(secName => {
      const secStudents = students.filter(s => s.section === secName);
      const total = secStudents.length;

      // Strict attendance checks:
      const aboveAtt = secStudents.filter(s => s.attendancePercentage > configuredThreshold);
      const belowAtt = secStudents.filter(s => s.attendancePercentage < configuredThreshold);
      const exactAtt = secStudents.filter(s => s.attendancePercentage === configuredThreshold);

      // Fee metrics:
      const feePaid = secStudents.filter(s => s.feeStatus === 'Fully Paid');
      const feeDue = secStudents.filter(s => s.feeStatus === 'Outstanding');

      // Risk metrics:
      const noRisk = secStudents.filter(s => s.riskCategory === 'No Risk');
      const atRisk = secStudents.filter(s => s.riskCategory === 'Risk');

      const avgAtt = total > 0
        ? +(secStudents.reduce((acc, s) => acc + s.attendancePercentage, 0) / total).toFixed(1)
        : 0;
      const avgMarks = total > 0
        ? +(secStudents.reduce((acc, s) => acc + s.internalAvg, 0) / total).toFixed(1)
        : 0;

      const totalFeesExpected = secStudents.reduce((acc, s) => acc + s.totalSemesterFee, 0);
      const totalFeesCollected = secStudents.reduce((acc, s) => acc + s.amountPaid, 0);
      const totalFeesOutstanding = secStudents.reduce((acc, s) => acc + s.outstandingBalance, 0);

      return {
        section: secName,
        totalStudents: total,
        // No Risk / Risk (Primary Terminology)
        noRiskCount: noRisk.length,
        riskCount: atRisk.length,
        noRiskPercentage: total > 0 ? +((noRisk.length / total) * 100).toFixed(1) : 0,
        riskPercentage: total > 0 ? +((atRisk.length / total) * 100).toFixed(1) : 0,

        // Backward compatibility for existing tests
        positiveCount: noRisk.length,
        negativeCount: atRisk.length,
        positivePercentage: total > 0 ? +((noRisk.length / total) * 100).toFixed(1) : 0,
        negativePercentage: total > 0 ? +((atRisk.length / total) * 100).toFixed(1) : 0,

        // Attendance distribution
        aboveThresholdCount: aboveAtt.length,
        belowThresholdCount: belowAtt.length,
        exactThresholdCount: exactAtt.length,
        aboveThresholdPercentage: total > 0 ? +((aboveAtt.length / total) * 100).toFixed(1) : 0,
        belowThresholdPercentage: total > 0 ? +((belowAtt.length / total) * 100).toFixed(1) : 0,
        exactThresholdPercentage: total > 0 ? +((exactAtt.length / total) * 100).toFixed(1) : 0,
        avgAttendance: avgAtt,
        attendanceThreshold: configuredThreshold,

        // Fees distribution
        feesPaidCount: feePaid.length,
        feesDueCount: feeDue.length,
        feesPaidPercentage: total > 0 ? +((feePaid.length / total) * 100).toFixed(1) : 0,
        feesDuePercentage: total > 0 ? +((feeDue.length / total) * 100).toFixed(1) : 0,
        totalFeesExpected,
        totalFeesCollected,
        totalFeesOutstanding,

        // Performance
        avgMarks,
        highRiskCount: secStudents.filter(s => s.riskStatus === 'COMBINED_RISK').length,
        moderateRiskCount: secStudents.filter(s => s.riskStatus === 'ATTENDANCE_RISK' || s.riskStatus === 'ACADEMIC_RISK').length,
        isDemoData: dataSource !== 'official'
      };
    });

    const totalStudents = students.length;
    const totalNoRisk = sectionStats.reduce((acc, s) => acc + s.noRiskCount, 0);
    const totalRisk = sectionStats.reduce((acc, s) => acc + s.riskCount, 0);

    const totalAboveAtt = sectionStats.reduce((acc, s) => acc + s.aboveThresholdCount, 0);
    const totalBelowAtt = sectionStats.reduce((acc, s) => acc + s.belowThresholdCount, 0);
    const totalExactAtt = sectionStats.reduce((acc, s) => acc + s.exactThresholdCount, 0);

    const totalFeesPaid = sectionStats.reduce((acc, s) => acc + s.feesPaidCount, 0);
    const totalFeesDue = sectionStats.reduce((acc, s) => acc + s.feesDueCount, 0);
    const totalExpected = sectionStats.reduce((acc, s) => acc + s.totalFeesExpected, 0);
    const totalCollected = sectionStats.reduce((acc, s) => acc + s.totalFeesCollected, 0);
    const totalOutstanding = sectionStats.reduce((acc, s) => acc + s.totalFeesOutstanding, 0);

    const avgAttendance = totalStudents > 0
      ? +(students.reduce((acc, s) => acc + s.attendancePercentage, 0) / totalStudents).toFixed(1)
      : 0;
    const avgInternal = totalStudents > 0
      ? +(students.reduce((acc, s) => acc + s.internalAvg, 0) / totalStudents).toFixed(1)
      : 0;

    return {
      department: 'Computer Science and Engineering (CSE)',
      institution: 'Bonam Venkata Chalamaya Engineering College (BVC)',
      isDemoData: dataSource !== 'official',
      isDemoMode: dataSource !== 'official',
      attendanceThreshold: configuredThreshold,
      stats: {
        totalStudents,
        totalFaculty: faculty.length,
        totalSections: sections.length,
        totalSubjects: subjects.length,
        // No Risk / Risk totals
        noRiskCount: totalNoRisk,
        riskCount: totalRisk,
        noRiskPercentage: totalStudents > 0 ? +((totalNoRisk / totalStudents) * 100).toFixed(1) : 0,
        riskPercentage: totalStudents > 0 ? +((totalRisk / totalStudents) * 100).toFixed(1) : 0,

        // Attendance metrics
        aboveThresholdCount: totalAboveAtt,
        belowThresholdCount: totalBelowAtt,
        exactThresholdCount: totalExactAtt,
        aboveThresholdPercentage: totalStudents > 0 ? +((totalAboveAtt / totalStudents) * 100).toFixed(1) : 0,
        belowThresholdPercentage: totalStudents > 0 ? +((totalBelowAtt / totalStudents) * 100).toFixed(1) : 0,
        avgAttendance,

        // Fee metrics
        feesPaidCount: totalFeesPaid,
        feesDueCount: totalFeesDue,
        feeCollectionRate: totalExpected > 0 ? `${((totalCollected / totalExpected) * 100).toFixed(1)}%` : '100%',
        totalFeesExpected: totalExpected,
        totalFeesCollected: totalCollected,
        totalFeesOutstanding: totalOutstanding,

        // High / Moderate risk counts for cards
        highRiskCount: sectionStats.reduce((acc, s) => acc + s.highRiskCount, 0),
        modRiskCount: sectionStats.reduce((acc, s) => acc + s.moderateRiskCount, 0),
        lowRiskCount: totalNoRisk
      },
      targetDistribution: {
        noRiskTotal: totalNoRisk,
        riskTotal: totalRisk,
        positiveTotal: totalNoRisk, // backward compat
        negativeTotal: totalRisk,   // backward compat
        totalStudents
      },
      sectionStats,
      teachingAssignments: assignments
    };
  }

  /**
   * Generates a fully filtered report table and CSV export.
   */
  static generateReport({ reportType = 'ATTENDANCE', section = 'ALL', subFilter = 'ALL', dataSource = 'presentation', threshold = 75.0, user = null }) {
    const configuredThreshold = Number(threshold) || 75.0;
    let students = this.getEnrichedStudents({
      dataSource,
      threshold: configuredThreshold,
      section: section === 'ALL' ? 'ALL' : section
    });

    const isDemo = dataSource !== 'official';
    const demoTag = isDemo ? ' [Demo Presentation Data]' : '';

    let filterLabel = 'All Records';

    // Apply category-specific subfilters
    if (reportType === 'ATTENDANCE') {
      if (subFilter === 'ABOVE_75' || subFilter === 'ABOVE') {
        students = students.filter(s => s.attendancePercentage > configuredThreshold);
        filterLabel = `Attendance Above ${configuredThreshold}%`;
      } else if (subFilter === 'BELOW_75' || subFilter === 'BELOW') {
        students = students.filter(s => s.attendancePercentage < configuredThreshold);
        filterLabel = `Attendance Below ${configuredThreshold}%`;
      } else if (subFilter === 'EXACT_75' || subFilter === 'EXACT') {
        students = students.filter(s => s.attendancePercentage === configuredThreshold);
        filterLabel = `Attendance Exactly ${configuredThreshold}%`;
      }
    } else if (reportType === 'FEES') {
      if (subFilter === 'PAID') {
        students = students.filter(s => s.feeStatus === 'Fully Paid');
        filterLabel = 'Fee Status: Fully Paid';
      } else if (subFilter === 'OUTSTANDING' || subFilter === 'DUE') {
        students = students.filter(s => s.feeStatus === 'Outstanding');
        filterLabel = 'Fee Status: Unpaid / Outstanding';
      }
    } else if (reportType === 'ACADEMIC_RISK' || reportType === 'RISK' || reportType === 'RISK_ANALYTICS') {
      if (subFilter === 'NO_RISK') {
        students = students.filter(s => s.riskCategory === 'No Risk');
        filterLabel = 'Risk Category: No Risk';
      } else if (subFilter === 'RISK' || subFilter === 'HIGH') {
        students = students.filter(s => s.riskCategory === 'Risk');
        filterLabel = 'Risk Category: Risk (Flagged)';
      }
    }

    const generationDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const sectionDisplay = section && section !== 'ALL' ? section : 'All Sections Combined';

    let reportTitle = '';
    let csvHeader = '';
    let rows = [];

    if (reportType === 'ATTENDANCE') {
      reportTitle = `BVC CSE Attendance Report - ${sectionDisplay}${demoTag}`;
      csvHeader = 'Roll Number,Student Name,Section,Attendance %,Attendance Category,Data Source\n';
      rows = students.map(s => [
        s.rollNumber,
        s.name,
        s.section,
        `${s.attendancePercentage}%`,
        s.attendanceCategory,
        isDemo ? 'Demo Data' : 'Official Record'
      ]);
    } else if (reportType === 'FEES') {
      reportTitle = `BVC CSE Semester Fee Status Report - ${sectionDisplay}${demoTag}`;
      csvHeader = 'Roll Number,Student Name,Section,Total Fee,Amount Paid,Outstanding Balance,Payment Status,Data Source\n';
      rows = students.map(s => [
        s.rollNumber,
        s.name,
        s.section,
        `₹${s.totalSemesterFee}`,
        `₹${s.amountPaid}`,
        `₹${s.outstandingBalance}`,
        s.feeStatus,
        isDemo ? 'Demo Data' : 'Official Record'
      ]);
    } else if (reportType === 'ACADEMIC_RISK' || reportType === 'RISK' || reportType === 'RISK_ANALYTICS') {
      reportTitle = `BVC CSE Academic Risk Audit Report - ${sectionDisplay}${demoTag}`;
      csvHeader = 'Roll Number,Student Name,Section,Attendance %,Academic Status,Fee Status,Risk Category,Risk Reason,Data Source\n';
      rows = students.map(s => [
        s.rollNumber,
        s.name,
        s.section,
        `${s.attendancePercentage}%`,
        s.academicStatus,
        s.feeStatus,
        s.riskCategory,
        s.primaryRiskReason,
        isDemo ? 'Demo Data' : 'Official Record'
      ]);
    } else {
      reportTitle = `BVC CSE Complete Student Roster - ${sectionDisplay}${demoTag}`;
      csvHeader = 'Roll Number,Student Name,Department,Academic Year,Section,Internal %,Attendance %,Risk Category,Fee Status,Data Source\n';
      rows = students.map(s => [
        s.rollNumber,
        s.name,
        s.department,
        s.academicYear,
        s.section,
        `${s.internalAvg}%`,
        `${s.attendancePercentage}%`,
        s.riskCategory,
        s.feeStatus,
        isDemo ? 'Demo Data' : 'Official Record'
      ]);
    }

    let csvContent = csvHeader;
    rows.forEach(r => {
      csvContent += r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    return {
      reportTitle,
      reportType,
      section: sectionDisplay,
      appliedFilter: filterLabel,
      subFilter,
      generationDate,
      authorName: user?.name || 'Head of Department',
      totalRecords: students.length,
      isDemoData: isDemo,
      students,
      csvContent
    };
  }
}
