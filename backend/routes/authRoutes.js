import { Router } from 'express';
import { login, registerSupervisor } from '../controllers/authController.js';
import { validateLogin, validateSupervisorRegistration } from '../middleware/validate.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

router.post('/login', validateLogin, asyncHandler(login));
router.post('/register', validateSupervisorRegistration, asyncHandler(registerSupervisor));

export default router;
