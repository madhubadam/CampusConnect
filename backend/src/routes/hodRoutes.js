import { Router } from 'express';
import { HodController } from '../controllers/hodController.js';
import { FacultyController } from '../controllers/facultyController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// HOD routes are strictly protected for HOD role
router.use(authenticate, requireRole(['HOD']));

router.get('/overview', HodController.getDepartmentOverview);
router.get('/faculty', HodController.getFacultyList);
router.post('/faculty', HodController.addFaculty);
router.patch('/faculty/:facultyId/status', HodController.toggleFacultyStatus);
router.delete('/faculty/:facultyId', HodController.removeFaculty);
router.post('/assignments', HodController.assignTeachingClass);
router.delete('/assignments/:assignmentId', HodController.deleteTeachingAssignment);
router.get('/reports', HodController.exportReport);

// HOD can view all students in any section
router.get('/sections/:sectionName/students', (req, res, next) => {
  FacultyController.getSectionStudents(req, res);
});

// HOD can view individual student detailed profile
router.get('/students/:studentId', (req, res, next) => {
  FacultyController.getStudentProfile(req, res);
});

export default router;
