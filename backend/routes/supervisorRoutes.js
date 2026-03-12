import { Router } from 'express';
import { createAgent, createOfficer, listTeam, reports, updateAgentCommission } from '../controllers/supervisorController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateCommissionUpdate, validateCreateAgent, validateCreateOfficer } from '../middleware/validate.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth, requireRole('supervisor'));
router.post('/create-officer', validateCreateOfficer, asyncHandler(createOfficer));
router.post('/create-agent', validateCreateAgent, asyncHandler(createAgent));
router.patch('/agent/:agentId/commission', validateCommissionUpdate, asyncHandler(updateAgentCommission));
router.get('/team', asyncHandler(listTeam));
router.get('/reports', asyncHandler(reports));

export default router;
