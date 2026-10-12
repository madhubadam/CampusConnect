import { Router } from 'express';
import { StudentController } from '../controllers/studentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Student routes are protected and strictly accessible to STUDENT accounts
router.use(authenticate, requireRole(['STUDENT']));

router.get('/profile', StudentController.getProfile);
router.get('/marks', StudentController.getSemesterMarks);
router.get('/attendance', StudentController.getAttendance);
router.get('/fees', StudentController.getFees);
router.get('/improvement', StudentController.getSubjectImprovement);
router.get('/study-goals', StudentController.getStudyGoals);
router.post('/study-goals', StudentController.createStudyGoal);
router.patch('/study-goals/:goalId', StudentController.toggleStudyGoal);
router.delete('/study-goals/:goalId', StudentController.deleteStudyGoal);
router.get('/risk-insights', StudentController.getRiskInsights);
router.get('/announcements', StudentController.getAnnouncements);
router.post('/request-correction', StudentController.requestProfileCorrection);

export default router;
