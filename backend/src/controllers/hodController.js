import { store } from '../services/store.js';
import { assignFacultySchema } from '../utils/validation.js';
import { StudentAnalyticsService } from '../services/studentAnalyticsService.js';

export class HodController {
  static async getDepartmentOverview(req, res) {
    // Mode parameter: default to presentation mode for presentation/80-20 scenario,
    // or official records if explicitly requested with mode=live or dataSource=official.
    const isLive = req.query.mode === 'live' || req.query.dataSource === 'official';
    const dataSource = isLive ? 'official' : 'presentation';
    const threshold = Number(req.query.threshold) || Number(req.query.attThreshold) || 75.0;

    const metrics = StudentAnalyticsService.getDepartmentMetrics({ dataSource, threshold });

    return res.status(200).json({
      success: true,
      ...metrics,
      hodName: req.user?.name || 'Department HOD',
      hodEmail: req.user?.email || '',
      passingThreshold: Number(req.query.passThreshold) || 40.0
    });
  }

  static async getFacultyList(req, res) {
    const list = store.get('faculty').filter(f => !f.isRemoved);
    return res.status(200).json({
      success: true,
      count: list.length,
      faculty: list
    });
  }

  static async addFaculty(req, res) {
    const { name, email, designation, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    if (!email.toLowerCase().endsWith('@bvcgroup.in')) {
      return res.status(400).json({ success: false, message: 'Faculty email must belong to @bvcgroup.in' });
    }

    const existing = store.find('faculty', f => f.email === email.toLowerCase());
    if (existing.length > 0 && !existing[0].isRemoved) {
      return res.status(409).json({ success: false, message: 'Faculty with this email already exists.' });
    }

    const newFacultyId = `FAC_${Date.now()}`;
    const newFaculty = {
      id: newFacultyId,
      name,
      email: email.toLowerCase(),
      designation: designation || 'Assistant Professor',
      phone: phone || '+91 94401 23456',
      department: 'CSE',
      assignedClasses: [],
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    store.create('faculty', newFaculty);

    store.logAudit(
      'FACULTY_PROVISIONED',
      req.user,
      `Provisioned faculty account for ${name} (${email})`
    );

    return res.status(201).json({
      success: true,
      message: `Faculty member ${name} provisioned successfully.`,
      faculty: newFaculty
    });
  }

  static async removeFaculty(req, res) {
    const { facultyId } = req.params;
    const faculty = store.findById('faculty', facultyId);

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    if (faculty.email === req.user?.email || faculty.role === 'HOD') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the Head of Department account.'
      });
    }

    // 1. Soft-delete / deactivate faculty record in store
    store.update('faculty', facultyId, {
      status: 'DEACTIVATED',
      isRemoved: true,
      isActive: false,
      assignedClasses: []
    });

    // 2. Unassign active teaching assignments
    const activeAssignments = store.find('teachingAssignments', ta => ta.facultyId === facultyId);
    activeAssignments.forEach(ta => {
      store.delete('teachingAssignments', ta.id);
    });

    // 3. Deactivate user login credentials if present
    const userDoc = store.findById('users', faculty.email);
    if (userDoc) {
      store.update('users', faculty.email, {
        isActive: false,
        status: 'DEACTIVATED'
      });
    }

    store.logAudit(
      'FACULTY_REMOVED',
      req.user,
      `Removed faculty member: ${faculty.name} (${faculty.email}). Revoked portal access and unassigned classes.`
    );

    return res.status(200).json({
      success: true,
      message: `Faculty member ${faculty.name} successfully removed. Access revoked while preserving historical academic records.`
    });
  }

  static async toggleFacultyStatus(req, res) {
    const { facultyId } = req.params;
    const faculty = store.findById('faculty', facultyId);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });

    const newStatus = !faculty.isActive;
    store.update('faculty', facultyId, { isActive: newStatus, status: newStatus ? 'ACTIVE' : 'INACTIVE' });

    store.logAudit(
      'FACULTY_STATUS_TOGGLED',
      req.user,
      `Toggled status for ${faculty.name} to ${newStatus ? 'ACTIVE' : 'INACTIVE'}`
    );

    return res.status(200).json({
      success: true,
      message: `Faculty status updated to ${newStatus ? 'Active' : 'Inactive'}.`,
      isActive: newStatus
    });
  }

  static async deleteTeachingAssignment(req, res) {
    const { assignmentId } = req.params;
    const assignment = store.findById('teachingAssignments', assignmentId);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Teaching assignment not found.' });
    }

    store.delete('teachingAssignments', assignmentId);

    const faculty = store.findById('faculty', assignment.facultyId);
    if (faculty && faculty.assignedClasses) {
      const updatedClasses = faculty.assignedClasses.filter(c =>
        !(c.section === assignment.section && c.subjectId === assignment.subjectId)
      );
      store.update('faculty', faculty.id, { assignedClasses: updatedClasses });
    }

    store.logAudit(
      'TEACHING_ASSIGNMENT_DELETED',
      req.user,
      `Deleted teaching assignment: ${assignment.facultyName} -> ${assignment.subjectName} (${assignment.section})`
    );

    return res.status(200).json({
      success: true,
      message: `Assignment for ${assignment.subjectName} (${assignment.section}) successfully deleted.`
    });
  }

  static async assignTeachingClass(req, res) {
    try {
      const parsed = assignFacultySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid assignment form'
        });
      }

      const { facultyId, subjectId, sectionId, academicYear, semester } = parsed.data;

      const faculty = store.findById('faculty', facultyId);
      const subject = store.findById('subjects', subjectId);

      if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
      if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });

      const existing = store.find(
        'teachingAssignments',
        ta => ta.subjectId === subjectId && ta.section === sectionId
      );

      if (existing.length > 0) {
        const current = existing[0];
        store.update('teachingAssignments', current.id, {
          facultyId,
          facultyName: faculty.name
        });
      } else {
        const assignmentDoc = {
          id: `TA_${Date.now()}`,
          facultyId,
          facultyName: faculty.name,
          subjectId,
          subjectName: subject.name,
          section: sectionId,
          academicYear,
          semester,
          assignedAt: new Date().toISOString()
        };
        store.create('teachingAssignments', assignmentDoc);
      }

      const currentClasses = faculty.assignedClasses || [];
      const hasClass = currentClasses.some(c => c.section === sectionId && c.subjectId === subjectId);
      if (!hasClass) {
        currentClasses.push({ section: sectionId, subjectId, subjectName: subject.name });
        store.update('faculty', facultyId, { assignedClasses: currentClasses });
      }

      store.logAudit(
        'TEACHING_ASSIGNMENT_UPDATED',
        req.user,
        `Assigned ${faculty.name} to ${subject.name} for ${sectionId}`
      );

      return res.status(200).json({
        success: true,
        message: `Successfully assigned ${faculty.name} to ${subject.name} (${sectionId}).`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async exportReport(req, res) {
    const {
      reportType = 'ATTENDANCE',
      section = 'ALL',
      subFilter = 'ALL',
      attendanceFilter,
      feeFilter,
      riskFilter,
      dataSource = 'presentation',
      threshold = 75.0
    } = req.query;

    // Resolve subFilter if specified under category-specific param names
    let resolvedSubFilter = subFilter;
    if (reportType === 'ATTENDANCE' && attendanceFilter) resolvedSubFilter = attendanceFilter;
    if (reportType === 'FEES' && feeFilter) resolvedSubFilter = feeFilter;
    if ((reportType === 'ACADEMIC_RISK' || reportType === 'RISK' || reportType === 'RISK_ANALYTICS') && riskFilter) {
      resolvedSubFilter = riskFilter;
    }

    const report = StudentAnalyticsService.generateReport({
      reportType,
      section,
      subFilter: resolvedSubFilter,
      dataSource,
      threshold,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      ...report
    });
  }
}
