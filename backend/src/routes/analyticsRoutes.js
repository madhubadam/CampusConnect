import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Protected for FACULTY and HOD
router.use(authenticate, requireRole(['FACULTY', 'HOD']));

router.get('/risk-distribution', AnalyticsController.getRiskAnalytics);
router.get('/students/:studentId/predict', AnalyticsController.predictStudentRisk);

export default router;
