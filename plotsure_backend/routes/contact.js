const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const contactController = require('../ controllers/contactController.js');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Validation rules
const contactFormValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('subject')
    .isIn(['general-inquiry', 'plot-interest', 'broker-services', 'technical-support', 'partnership'])
    .withMessage('Invalid subject'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
];

const updateContactValidation = [
  body('status')
    .optional()
    .isIn(['new', 'in_progress', 'responded', 'closed'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority')
];

const assignContactValidation = [
  body('assigned_to')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required for assignment')
];

const respondContactValidation = [
  body('response_message')
    .notEmpty()
    .withMessage('Response message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Response message must be between 10 and 5000 characters'),
  body('send_email')
    .optional()
    .isBoolean()
    .withMessage('Send email must be boolean')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid contact ID')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['new', 'in_progress', 'responded', 'closed'])
    .withMessage('Invalid status filter'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority filter'),
  query('subject')
    .optional()
    .isIn(['general-inquiry', 'plot-interest', 'broker-services', 'technical-support', 'partnership'])
    .withMessage('Invalid subject filter')
];

// Public routes (no authentication required)
router.post('/', 
  contactFormValidation,
  contactController.submitContactForm
);

// Protected routes (require authentication)
router.use(authenticateToken);

// Broker and admin routes
router.get('/', 
  queryValidation,
  requireRole(['broker', 'admin']),
  contactController.getAllContacts
);

router.get('/stats', 
  requireRole(['broker', 'admin']),
  contactController.getContactStats
);

router.get('/:id', 
  idValidation,
  requireRole(['broker', 'admin']),
  contactController.getContactById
);

router.put('/:id/status', 
  idValidation,
  updateContactValidation,
  requireRole(['broker', 'admin']),
  contactController.updateContactStatus
);

router.put('/:id/assign', 
  idValidation,
  assignContactValidation,
  requireRole(['broker', 'admin']),
  contactController.assignContact
);

router.put('/:id/respond', 
  idValidation,
  respondContactValidation,
  requireRole(['broker', 'admin']),
  contactController.respondToContact
);

// Admin only routes
router.delete('/:id', 
  idValidation,
  requireRole(['admin']),
  contactController.deleteContact
);

module.exports = router; 