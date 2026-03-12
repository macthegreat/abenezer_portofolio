import { badRequest } from '../utils/errors.js';

function isNonEmptyString(value, min = 1, max = 255) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

function isValidAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 1000;
}

function isValidWindow(value) {
  return ['daily', 'weekly', 'monthly'].includes(value);
}

function isValidIdno(value) {
  return typeof value === 'string' && /^[A-Za-z0-9-]{3,50}$/.test(value.trim());
}

function ensure(condition, message, details) {
  if (!condition) throw badRequest(message, details);
}

export function validateLogin(req, _res, next) {
  const { email, password } = req.body;
  ensure(isValidEmail(email), 'Invalid email format.');
  ensure(isValidPassword(password), 'Password must be at least 8 characters.');
  next();
}

export function validateSupervisorRegistration(req, _res, next) {
  const { name, email, password } = req.body;
  ensure(isNonEmptyString(name, 2, 120), 'Name must be between 2 and 120 characters.');
  ensure(isValidEmail(email), 'Invalid email format.');
  ensure(isValidPassword(password), 'Password must be at least 8 characters.');
  next();
}

export function validateCreateOfficer(req, _res, next) {
  const { name, email, password } = req.body;
  ensure(isNonEmptyString(name, 2, 120), 'Officer name must be between 2 and 120 characters.');
  ensure(isValidEmail(email), 'Invalid officer email format.');
  ensure(isValidPassword(password), 'Officer password must be at least 8 characters.');
  next();
}

export function validateCreateAgent(req, _res, next) {
  const { name, email, password, commissionPerPerson } = req.body;
  ensure(isNonEmptyString(name, 2, 120), 'Agent name must be between 2 and 120 characters.');
  ensure(isValidEmail(email), 'Invalid agent email format.');
  ensure(isValidPassword(password), 'Agent password must be at least 8 characters.');
  ensure(Number.isFinite(Number(commissionPerPerson)) && Number(commissionPerPerson) >= 0, 'Commission per person must be a number >= 0.');
  next();
}

export function validateCommissionUpdate(req, _res, next) {
  const { commissionPerPerson } = req.body;
  ensure(Number.isFinite(Number(commissionPerPerson)) && Number(commissionPerPerson) >= 0, 'Commission per person must be a number >= 0.');
  next();
}

export function validateAgentSubmission(req, _res, next) {
  const { fullName, idno } = req.body;
  ensure(isNonEmptyString(fullName, 1, 120), 'Full name must be between 1 and 120 characters.');
  ensure(isValidIdno(idno), 'IDNO must be 3-50 chars and only letters, numbers, or hyphen.');
  next();
}

export function validateRegistration(req, _res, next) {
  const { fullName, idno, amount } = req.body;
  ensure(isNonEmptyString(fullName, 1, 120), 'Full name must be between 1 and 120 characters.');
  ensure(isValidIdno(idno), 'IDNO must be 3-50 chars and only letters, numbers, or hyphen.');
  ensure(isValidAmount(amount), 'Amount must be a number greater than or equal to 1000.');
  next();
}

export function validateWindowParam(req, _res, next) {
  ensure(isValidWindow(req.params.window), 'Invalid report window. Use daily, weekly, or monthly.');
  next();
}

export function validateIdnoParam(req, _res, next) {
  ensure(isValidIdno(req.params.idno), 'Invalid IDNO format.');
  next();
}
