import { Router } from 'express';
import { registerUser, report } from '../controllers/officerController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateRegistration, validateWindowParam } from '../middleware/validate.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth, requireRole('officer'));
router.post('/register-user', validateRegistration, asyncHandler(registerUser));
router.get('/report/:window(daily|weekly|monthly)', validateWindowParam, asyncHandler(report));

export default router;
