import { Router } from 'express';
import { commission, matches, submitPerson } from '../controllers/agentController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateAgentSubmission, validateWindowParam } from '../middleware/validate.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth, requireRole('agent'));
router.post('/submit-person', validateAgentSubmission, asyncHandler(submitPerson));
router.get('/matches', asyncHandler(matches));
router.get('/commission/:window(daily|weekly|monthly)', validateWindowParam, asyncHandler(commission));

export default router;
