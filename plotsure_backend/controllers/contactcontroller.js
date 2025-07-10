const { Contact, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const emailService = require('../utils/emailService');

// Submit contact form
exports.submitContactForm = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add tracking information
    const contactData = {
      ...req.body,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    // Set priority based on subject
    const priorityMap = {
      'technical-support': 'high',
      'partnership': 'high',
      'broker-services': 'medium',
      'plot-interest': 'medium',
      'general-inquiry': 'low'
    };
    contactData.priority = priorityMap[contactData.subject] || 'medium';

    // Create contact submission
    const contact = await Contact.create(contactData);

    // Send confirmation email to customer
    emailService.sendContactConfirmation(
      contact.email,
      contact.name,
      contact.subject
    ).catch(err => console.error('Failed to send contact confirmation:', err));

    // Send notification to admin (you can customize this)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (adminEmail) {
      emailService.sendEmail({
        to: adminEmail,
        subject: `New Contact Form Submission: ${contact.subject}`,
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>From:</strong> ${contact.name} (${contact.email})</p>
          <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${contact.subject}</p>
          <p><strong>Priority:</strong> ${contact.priority}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff;">
            ${contact.message}
          </div>
          <p><strong>Submitted:</strong> ${contact.created_at}</p>
        `,
        text: `New contact from ${contact.name}: ${contact.message}`
      }).catch(err => console.error('Failed to send admin notification:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you within 24-48 hours.',
      data: {
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          subject: contact.subject,
          created_at: contact.created_at
        }
      }
    });

  } catch (error) {
    console.error('Submit contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: error.message
    });
  }
};

// Get all contact submissions (admin/broker only)
exports.getAllContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      subject,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Build where clause based on filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (subject) where.subject = subject;

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: contacts } = await Contact.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'respondedByUser',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalContacts: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact submissions',
      error: error.message
    });
  }
};

// Get single contact by ID
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'respondedByUser',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { contact }
    });

  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact submission',
      error: error.message
    });
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    await contact.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: { contact }
    });

  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status',
      error: error.message
    });
  }
};

// Assign contact to user
exports.assignContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Verify the user exists
    const user = await User.findByPk(assigned_to);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user assignment'
      });
    }

    await contact.assignTo(assigned_to);

    res.status(200).json({
      success: true,
      message: 'Contact assigned successfully',
      data: { contact }
    });

  } catch (error) {
    console.error('Assign contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign contact',
      error: error.message
    });
  }
};

// Respond to contact
exports.respondToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { response_message, send_email = true } = req.body;

    if (!response_message || response_message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Update contact with response
    await contact.respond(response_message, req.user.id);

    // Send email response to customer if requested
    if (send_email) {
      const emailResult = await emailService.sendEmail({
        to: contact.email,
        subject: `Response to your inquiry: ${contact.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f8fafc; }
              .original-message { background: #e5e7eb; padding: 15px; border-left: 4px solid #6b7280; margin: 15px 0; }
              .footer { padding: 20px; text-align: center; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏞️ PlotSure Connect</h1>
                <h2>Response to Your Inquiry</h2>
              </div>
              <div class="content">
                <h3>Hello ${contact.name},</h3>
                <p>Thank you for contacting PlotSure Connect. Here is our response to your inquiry:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  ${response_message.replace(/\n/g, '<br>')}
                </div>
                
                <div class="original-message">
                  <h4>Your Original Message:</h4>
                  <p><strong>Subject:</strong> ${contact.subject}</p>
                  <p>${contact.message}</p>
                </div>
                
                <p>If you have any additional questions, please don't hesitate to contact us.</p>
              </div>
              <div class="footer">
                <p>Best regards,<br>The PlotSure Connect Team</p>
                <p>📧 support@plotsureconnect.rw | 📞 +250 788 XXX XXX</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Hello ${contact.name},\n\nThank you for contacting PlotSure Connect. Here is our response:\n\n${response_message}\n\nYour original message: ${contact.message}\n\nBest regards,\nThe PlotSure Connect Team`
      });

      if (!emailResult.success) {
        console.error('Failed to send email response:', emailResult.error);
      }
    }

    // Get updated contact with associations
    const updatedContact = await Contact.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'respondedByUser',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Response sent successfully',
      data: { contact: updatedContact }
    });

  } catch (error) {
    console.error('Respond to contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send response',
      error: error.message
    });
  }
};

// Get contact statistics
exports.getContactStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      Contact.count({ where: { status: 'new' } }),
      Contact.count({ where: { status: 'in_progress' } }),
      Contact.count({ where: { status: 'responded' } }),
      Contact.count({ where: { status: 'closed' } }),
      Contact.count({ where: { priority: 'high' } }),
      Contact.count({ where: { priority: 'medium' } }),
      Contact.count({ where: { priority: 'low' } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        new_contacts: stats[0] || 0,
        in_progress: stats[1] || 0,
        responded: stats[2] || 0,
        closed: stats[3] || 0,
        high_priority: stats[4] || 0,
        medium_priority: stats[5] || 0,
        low_priority: stats[6] || 0,
        total_contacts: stats.slice(0, 4).reduce((a, b) => a + b, 0)
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact statistics',
      error: error.message
    });
  }
};

// Delete contact (admin only)
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    await contact.destroy();

    res.status(200).json({
      success: true,
      message: 'Contact submission deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact submission',
      error: error.message
    });
  }
};