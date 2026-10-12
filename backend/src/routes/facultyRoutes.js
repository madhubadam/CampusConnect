import { Router } from 'express';
import { FacultyController } from '../controllers/facultyController.js';
import { authenticate, requireRole, requireFacultySectionAccess } from '../middleware/auth.js';

const router = Router();

// Protected for FACULTY and HOD
router.use(authenticate, requireRole(['FACULTY', 'HOD']));

router.get('/overview', FacultyController.getOverview);
router.get('/my-classes', FacultyController.getMyClasses);

// Class roster and full department student directory
router.get('/sections/:sectionName/students', requireFacultySectionAccess('sectionName'), FacultyController.getSectionStudents);
router.get('/students', FacultyController.getSectionStudents);
router.get('/students/:studentId', FacultyController.getStudentProfile);
router.put('/students/:studentId', FacultyController.updateStudent);

// Add student: checks that faculty is authorized for the target section in req.body
router.post('/students', requireFacultySectionAccess('section'), FacultyController.addStudent);

// Attendance marking & correction: checks section access
router.post('/attendance', requireFacultySectionAccess('sectionId'), FacultyController.markAttendance);
router.put('/attendance/:sessionId', requireFacultySectionAccess('sectionId'), FacultyController.updateAttendance);

// Marks management
router.post('/assessments', requireFacultySectionAccess('sectionId'), FacultyController.createAssessment);
router.post('/marks', requireFacultySectionAccess('sectionId'), FacultyController.enterMarks);

// Interventions
router.post('/interventions', FacultyController.logIntervention);
router.get('/interventions', FacultyController.getInterventions);

export default router;
