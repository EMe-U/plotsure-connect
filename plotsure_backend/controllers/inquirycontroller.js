const { Inquiry, Listing, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const emailService = require('../utils/emailService');

// Create new inquiry
exports.createInquiry = async (req, res) => {
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

    const { listing_id } = req.body;

    // Verify listing exists if listing_id is provided
    let listing = null;
    if (listing_id) {
      listing = await Listing.findByPk(listing_id, {
        include: [{ model: User, as: 'broker' }]
      });

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
      }

      if (listing.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'This listing is not available for inquiries'
        });
      }
    }

    // Add tracking information
    const inquiryData = {
      ...req.body,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    // Create inquiry
    const inquiry = await Inquiry.create(inquiryData);

    // If listing exists, increment inquiry count and auto-assign to broker
    if (listing) {
      // Increment inquiry count on listing
      listing.increment('inquiries_count').catch(err => 
        console.error('Failed to increment inquiry count:', err)
      );

      // Auto-assign to listing broker
      if (listing.broker) {
        inquiry.update({ assigned_to: listing.broker.id }).catch(err => 
          console.error('Failed to auto-assign inquiry:', err)
        );
      }

      // Send notification emails
      if (listing.broker && listing.broker.email) {
        emailService.sendInquiryNotification(
          listing.broker.email,
          listing.broker.name,
          inquiry.inquirer_name,
          listing.title,
          inquiry.message
        ).catch(err => console.error('Failed to send broker notification:', err));
      }
    }

    // Send confirmation email to customer
    emailService.sendInquiryConfirmation(
      inquiry.inquirer_email,
      inquiry.inquirer_name,
      listing ? listing.title : 'General Inquiry'
    ).catch(err => console.error('Failed to send customer confirmation:', err));

    // Get complete inquiry with associations
    const completeInquiry = await Inquiry.findByPk(inquiry.id, {
      include: [
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'price_amount', 'price_currency'],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. You will receive a response within 24 hours.',
      data: { inquiry: completeInquiry }
    });

  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry',
      error: error.message
    });
  }
};

// Get all inquiries (for brokers/admins)
exports.getAllInquiries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      inquiry_type,
      assigned_to,
      listing_id,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // For brokers, only show inquiries assigned to them or from their listings
    if (req.user.role === 'broker') {
      where[Op.or] = [
        { assigned_to: req.user.id },
        { '$listing.broker_id$': req.user.id }
      ];
    }

    // Build where clause based on filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (inquiry_type) where.inquiry_type = inquiry_type;
    if (assigned_to) where.assigned_to = assigned_to;
    if (listing_id) where.listing_id = listing_id;

    // Search filter
    if (search) {
      where[Op.or] = [
        { inquirer_name: { [Op.like]: `%${search}%` } },
        { inquirer_email: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: inquiries } = await Inquiry.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      include: [
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'listing_reference', 'price_amount', 'price_currency'],
          include: [
            {
              model: User,
              as: 'broker',
              attributes: ['id', 'name', 'email']
            }
          ],
          required: false
        },
        {
          model: User,
          as: 'assignedBroker',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        inquiries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalInquiries: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inquiries',
      error: error.message
    });
  }
};

// Get single inquiry by ID
exports.getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await Inquiry.findByPk(id, {
      include: [
        {
          model: Listing,
          as: 'listing',
          include: [
            {
              model: User,
              as: 'broker',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ],
          required: false
        },
        {
          model: User,
          as: 'assignedBroker',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Check access permissions
    const hasAccess = req.user.role === 'admin' || 
                     inquiry.assigned_to === req.user.id ||
                     (inquiry.listing && inquiry.listing.broker_id === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { inquiry }
    });

  } catch (error) {
    console.error('Get inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inquiry',
      error: error.message
    });
  }
};

// Update inquiry status
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, internal_notes, follow_up_date, follow_up_notes } = req.body;

    const inquiry = await Inquiry.findByPk(id, {
      include: [
        {
          model: Listing,
          as: 'listing',
          include: [{ model: User, as: 'broker' }],
          required: false
        }
      ]
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Check permissions
    const hasAccess = req.user.role === 'admin' || 
                     inquiry.assigned_to === req.user.id ||
                     (inquiry.listing && inquiry.listing.broker_id === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update inquiry
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (internal_notes) updateData.internal_notes = internal_notes;
    if (follow_up_date) updateData.next_follow_up_date = follow_up_date;
    if (follow_up_notes) updateData.follow_up_notes = follow_up_notes;

    await inquiry.update(updateData);

    // If marking as responded, update response tracking
    if (status === 'responded') {
      await inquiry.update({
        response_count: inquiry.response_count + 1,
        last_response_date: new Date(),
        first_response_date: inquiry.first_response_date || new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully',
      data: { inquiry }
    });

  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inquiry',
      error: error.message
    });
  }
};

// Assign inquiry to broker
exports.assignInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    const inquiry = await Inquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Verify the broker exists
    const broker = await User.findByPk(assigned_to);
    if (!broker || !['broker', 'admin'].includes(broker.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid broker assignment'
      });
    }

    await inquiry.update({
      assigned_to,
      status: inquiry.status === 'new' ? 'contacted' : inquiry.status
    });

    res.status(200).json({
      success: true,
      message: 'Inquiry assigned successfully',
      data: { inquiry }
    });

  } catch (error) {
    console.error('Assign inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign inquiry',
      error: error.message
    });
  }
};

// Mark inquiry as converted
exports.markAsConverted = async (req, res) => {
  try {
    const { id } = req.params;
    const { conversion_value } = req.body;

    const inquiry = await Inquiry.findByPk(id, {
      include: [
        {
          model: Listing,
          as: 'listing',
          include: [{ model: User, as: 'broker' }],
          required: false
        }
      ]
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Check permissions
    const hasAccess = req.user.role === 'admin' || 
                     inquiry.assigned_to === req.user.id ||
                     (inquiry.listing && inquiry.listing.broker_id === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await inquiry.update({
      status: 'converted',
      converted_date: new Date(),
      conversion_value: conversion_value || null
    });

    res.status(200).json({
      success: true,
      message: 'Inquiry marked as converted successfully',
      data: { inquiry }
    });

  } catch (error) {
    console.error('Mark converted error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark inquiry as converted',
      error: error.message
    });
  }
};

// Get inquiries requiring follow-up
exports.getFollowUpInquiries = async (req, res) => {
  try {
    const brokerId = req.user.role === 'broker' ? req.user.id : null;
    
    const where = {
      next_follow_up_date: {
        [Op.lte]: new Date()
      },
      status: ['contacted', 'in_progress', 'responded']
    };

    if (brokerId) {
      where[Op.or] = [
        { assigned_to: brokerId },
        { '$listing.broker_id$': brokerId }
      ];
    }

    const inquiries = await Inquiry.findAll({
      where,
      order: [['next_follow_up_date', 'ASC']],
      include: [
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'listing_reference'],
          include: [
            {
              model: User,
              as: 'broker',
              attributes: ['id', 'name', 'email']
            }
          ],
          required: false
        },
        {
          model: User,
          as: 'assignedBroker',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: { inquiries }
    });

  } catch (error) {
    console.error('Get follow-up inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve follow-up inquiries',
      error: error.message
    });
  }
};

// Get inquiry statistics
exports.getInquiryStats = async (req, res) => {
  try {
    const brokerId = req.user.role === 'broker' ? req.user.id : null;
    const where = {};

    if (brokerId) {
      where[Op.or] = [
        { assigned_to: brokerId },
        { '$listing.broker_id$': brokerId }
      ];
    }

    const stats = await Promise.all([
      Inquiry.count({ 
        where: { ...where, status: 'new' },
        include: brokerId ? [{ model: Listing, as: 'listing' }] : []
      }),
      Inquiry.count({ 
        where: { ...where, status: 'in_progress' },
        include: brokerId ? [{ model: Listing, as: 'listing' }] : []
      }),
      Inquiry.count({ 
        where: { ...where, status: 'responded' },
        include: brokerId ? [{ model: Listing, as: 'listing' }] : []
      }),
      Inquiry.count({ 
        where: { ...where, status: 'converted' },
        include: brokerId ? [{ model: Listing, as: 'listing' }] : []
      }),
      Inquiry.count({
        where: {
          ...where,
          next_follow_up_date: { [Op.lte]: new Date() },
          status: ['contacted', 'in_progress', 'responded']
        },
        include: brokerId ? [{ model: Listing, as: 'listing' }] : []
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        new_inquiries: stats[0] || 0,
        in_progress: stats[1] || 0,
        responded: stats[2] || 0,
        converted: stats[3] || 0,
        follow_up_due: stats[4] || 0
      }
    });

  } catch (error) {
    console.error('Get inquiry stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inquiry statistics',
      error: error.message
    });
  }
};

// Delete inquiry (admin only)
exports.deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await Inquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    await inquiry.destroy();

    res.status(200).json({
      success: true,
      message: 'Inquiry deleted successfully'
    });

  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inquiry',
      error: error.message
    });
  }
};