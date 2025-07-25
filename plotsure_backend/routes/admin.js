const express = require('express');
const router = express.Router();
const { ActivityLog, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Parser } = require('json2csv');

// Admin-only: Download activity logs as CSV or JSON
router.get('/activity-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']]
    });
    const format = req.query.format || 'json';
    if (format === 'csv') {
      const fields = ['id', 'user_id', 'user.name', 'user.email', 'action', 'entity', 'entity_id', 'details', 'created_at'];
      const parser = new Parser({ fields });
      const csv = parser.parse(logs.map(log => ({
        ...log.toJSON(),
        'user.name': log.user ? log.user.name : '',
        'user.email': log.user ? log.user.email : ''
      })));
      res.header('Content-Type', 'text/csv');
      res.attachment('activity_logs.csv');
      return res.send(csv);
    } else {
      return res.json({ success: true, data: logs });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs', error: err.message });
  }
});

module.exports = router; 