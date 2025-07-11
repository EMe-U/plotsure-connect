const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const inquiryController = require('../controllers/inquiryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Validation rules
const createInquiryValidation = [
  body('listing_id')
    .isInt({ min: 1 })
    .withMessage('Valid listing ID is required'),
  body('inquirer_name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('inquirer_email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('inquirer_phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('inquirer_location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('is_diaspora')
    .optional()
    .isBoolean()
    .withMessage('Diaspora status must be boolean'),
  body('preferred_contact')
    .optional()
    .isIn(['email', 'phone', 'whatsapp'])
    .withMessage('Invalid preferred contact method'),
  body('inquiry_type')
    .isIn(['general_interest', 'site_visit', 'price_negotiation', 'document_verification', 'purchase_intent', 'reservation'])
    .withMessage('Invalid inquiry type'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('budget_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be positive'),
  body('budget_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be positive'),
  body('budget_currency')
    .optional()
    .isIn(['RWF', 'USD'])
    .withMessage('Currency must be RWF or USD'),
  body('timeframe')
    .optional()
    .isIn(['immediate', 'within_month', 'within_3months', 'within_6months', 'flexible'])
    .withMessage('Invalid timeframe'),
  body('visit_preference')
    .optional()
    .isIn(['physical_visit', 'virtual_tour', 'video_call', 'not_needed'])
    .withMessage('Invalid visit preference')
];

const updateInquiryValidation = [
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'in_progress', 'responded', 'closed', 'converted'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('internal_notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Internal notes cannot exceed 2000 characters'),
  body('follow_up_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid follow-up date format'),
  body('follow_up_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Follow-up notes cannot exceed 1000 characters')
];

const assignInquiryValidation = [
  body('assigned_to')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required for assignment')
];

const convertInquiryValidation = [
  body('conversion_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Conversion value must be positive')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid inquiry ID')
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
    .isIn(['new', 'contacted', 'in_progress', 'responded', 'closed', 'converted'])
    .withMessage('Invalid status filter'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority filter'),
  query('inquiry_type')
    .optional()
    .isIn(['general_interest', 'site_visit', 'price_negotiation', 'document_verification', 'purchase_intent', 'reservation'])
    .withMessage('Invalid inquiry type filter'),
  query('assigned_to')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a valid user ID'),
  query('listing_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Listing ID must be a valid integer')
];

// Public routes (no authentication required)
router.post('/', 
  createInquiryValidation,
  inquiryController.createInquiry
);

// Protected routes (require authentication)
router.use(authenticateToken);

// Broker and admin routes
router.get('/', 
  queryValidation,
  requireRole(['broker', 'admin']),
  inquiryController.getAllInquiries
);

router.get('/stats', 
  requireRole(['broker', 'admin']),
  inquiryController.getInquiryStats
);

router.get('/follow-up', 
  requireRole(['broker', 'admin']),
  inquiryController.getFollowUpInquiries
);

router.get('/:id', 
  idValidation,
  requireRole(['broker', 'admin']),
  inquiryController.getInquiryById
);

router.put('/:id/status', 
  idValidation,
  updateInquiryValidation,
  requireRole(['broker', 'admin']),
  inquiryController.updateInquiryStatus
);

router.put('/:id/assign', 
  idValidation,
  assignInquiryValidation,
  requireRole(['broker', 'admin']),
  inquiryController.assignInquiry
);

router.put('/:id/convert', 
  idValidation,
  convertInquiryValidation,
  requireRole(['broker', 'admin']),
  inquiryController.markAsConverted
);

// Admin only routes
router.delete('/:id', 
  idValidation,
  requireRole(['admin']),
  inquiryController.deleteInquiry
);

module.exports = router;