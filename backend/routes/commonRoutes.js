import { Router } from 'express';
import { idnoLookup } from '../controllers/commonController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateIdnoParam } from '../middleware/validate.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth);
router.get('/idno/:idno', validateIdnoParam, asyncHandler(idnoLookup));

export default router;
