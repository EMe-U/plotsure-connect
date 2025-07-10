const { Listing, Document, Media, User, Inquiry } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const fileHelper = require('../utils/fileHelper');
const emailService = require('../utils/emailService');

// Get all listings with optional filtering
exports.getAllListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      status = 'active',
      district,
      sector,
      land_type,
      min_price,
      max_price,
      min_size,
      max_size,
      featured,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Build where clause based on filters
    if (status) where.status = status;
    if (district) where.district = district;
    if (sector) where.sector = sector;
    if (land_type) where.land_type = land_type;
    if (featured !== undefined) where.featured = featured === 'true';

    // Price range filter
    if (min_price || max_price) {
      where.price_amount = {};
      if (min_price) where.price_amount[Op.gte] = parseFloat(min_price);
      if (max_price) where.price_amount[Op.lte] = parseFloat(max_price);
    }

    // Size range filter
    if (min_size || max_size) {
      where.land_size_value = {};
      if (min_size) where.land_size_value[Op.gte] = parseFloat(min_size);
      if (max_size) where.land_size_value[Op.lte] = parseFloat(max_size);
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { village: { [Op.like]: `%${search}%` } },
        { sector: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: listings } = await Listing.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['featured', 'DESC'], ['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'broker',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Media,
          as: 'media',
          where: { media_type: 'image' },
          required: false,
          limit: 1,
          order: [['is_primary', 'DESC'], ['display_order', 'ASC']]
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'name', 'document_type', 'is_verified'],
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        listings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalListings: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve listings',
      error: error.message
    });
  }
};

// Get single listing by ID
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByPk(id, {
      include: [
        {
          model: User,
          as: 'broker',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Document,
          as: 'documents',
          order: [['display_order', 'ASC'], ['created_at', 'ASC']]
        },
        {
          model: Media,
          as: 'media',
          order: [['is_primary', 'DESC'], ['display_order', 'ASC'], ['created_at', 'ASC']]
        },
        {
          model: Inquiry,
          as: 'inquiries',
          attributes: ['id', 'status', 'created_at'],
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Increment view count (don't await to avoid slowing response)
    listing.incrementViews().catch(err => 
      console.error('Failed to increment views:', err)
    );

    res.status(200).json({
      success: true,
      data: { listing }
    });

  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve listing',
      error: error.message
    });
  }
};

// Create new listing
exports.createListing = async (req, res) => {
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

    const listingData = {
      ...req.body,
      broker_id: req.user.id
    };

    // Create listing
    const listing = await Listing.create(listingData);

    // Handle file uploads if present
    if (req.files) {
      // Handle documents
      if (req.files.documents && req.files.documents.length > 0) {
        const documentPromises = req.files.documents.map(file => {
          return Document.create({
            listing_id: listing.id,
            name: file.originalname,
            document_type: req.body.document_types?.[file.fieldname] || 'other',
            file_path: file.path,
            file_name: file.filename,
            file_size: file.size,
            file_type: file.mimetype
          });
        });
        await Promise.all(documentPromises);
      }

      // Handle images
      if (req.files.images && req.files.images.length > 0) {
        const imagePromises = req.files.images.map((file, index) => {
          return Media.create({
            listing_id: listing.id,
            media_type: 'image',
            file_name: file.filename,
            file_path: file.path,
            file_size: file.size,
            file_type: file.mimetype,
            is_primary: index === 0, // First image is primary
            display_order: index
          });
        });
        await Promise.all(imagePromises);
      }

      // Handle videos
      if (req.files.videos && req.files.videos.length > 0) {
        const videoPromises = req.files.videos.map((file, index) => {
          return Media.create({
            listing_id: listing.id,
            media_type: 'video',
            file_name: file.filename,
            file_path: file.path,
            file_size: file.size,
            file_type: file.mimetype,
            display_order: index
          });
        });
        await Promise.all(videoPromises);
      }
    }

    // Get complete listing with associations
    const completeListing = await Listing.findByPk(listing.id, {
      include: [
        { model: Document, as: 'documents' },
        { model: Media, as: 'media' },
        { model: User, as: 'broker', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: { listing: completeListing }
    });

  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create listing',
      error: error.message
    });
  }
};

// Update listing
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const listing = await Listing.findByPk(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership (broker can only edit their own listings, admin can edit all)
    if (req.user.role !== 'admin' && listing.broker_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own listings'
      });
    }

    // Update listing
    await listing.update(req.body);

    // Get updated listing with associations
    const updatedListing = await Listing.findByPk(id, {
      include: [
        { model: Document, as: 'documents' },
        { model: Media, as: 'media' },
        { model: User, as: 'broker', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      data: { listing: updatedListing }
    });

  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: error.message
    });
  }
};

// Delete listing
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByPk(id, {
      include: [
        { model: Document, as: 'documents' },
        { model: Media, as: 'media' }
      ]
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && listing.broker_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own listings'
      });
    }

    // Collect file paths for deletion
    const filePaths = [];
    listing.documents.forEach(doc => filePaths.push(doc.file_path));
    listing.media.forEach(media => filePaths.push(media.file_path));

    // Delete listing (will cascade to documents and media due to foreign key constraints)
    await listing.destroy();

    // Delete associated files (don't wait for this)
    if (filePaths.length > 0) {
      fileHelper.deleteFiles(filePaths).catch(err => 
        console.error('Failed to delete some files:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing',
      error: error.message
    });
  }
};

// Toggle listing featured status (admin only)
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const listing = await Listing.findByPk(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    await listing.setFeatured(featured);

    res.status(200).json({
      success: true,
      message: `Listing ${featured ? 'featured' : 'unfeatured'} successfully`,
      data: { listing }
    });

  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured status',
      error: error.message
    });
  }
};

// Verify listing (admin only)
exports.verifyListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { verification_notes } = req.body;

    const listing = await Listing.findByPk(id, {
      include: [{ model: User, as: 'broker' }]
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Update verification status
    await listing.update({
      is_verified: true,
      verified_by: req.user.id,
      verification_date: new Date(),
      verification_notes,
      status: 'active' // Automatically make active when verified
    });

    // Send notification email to broker
    if (listing.broker && listing.broker.email) {
      emailService.sendListingVerificationEmail(
        listing.broker.email,
        listing.broker.name,
        listing.title
      ).catch(err => console.error('Failed to send verification email:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Listing verified successfully',
      data: { listing }
    });

  } catch (error) {
    console.error('Verify listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify listing',
      error: error.message
    });
  }
};

// Get listings by broker
exports.getBrokerListings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const brokerId = req.user.id;

    const where = { broker_id: brokerId };
    if (status) where.status = status;

    const { count, rows: listings } = await Listing.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Media,
          as: 'media',
          where: { media_type: 'image', is_primary: true },
          required: false
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'name', 'document_type', 'is_verified']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        listings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalListings: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get broker listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve broker listings',
      error: error.message
    });
  }
};

// Get listing statistics
exports.getListingStats = async (req, res) => {
  try {
    const brokerId = req.user.role === 'admin' ? null : req.user.id;
    const where = brokerId ? { broker_id: brokerId } : {};

    const stats = await Promise.all([
      Listing.count({ where: { ...where, status: 'active' } }),
      Listing.count({ where: { ...where, status: 'sold' } }),
      Listing.count({ where: { ...where, status: 'reserved' } }),
      Listing.count({ where: { ...where, featured: true } }),
      Listing.sum('views_count', { where }),
      Listing.sum('inquiries_count', { where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        active_listings: stats[0] || 0,
        sold_listings: stats[1] || 0,
        reserved_listings: stats[2] || 0,
        featured_listings: stats[3] || 0,
        total_views: stats[4] || 0,
        total_inquiries: stats[5] || 0
      }
    });

  } catch (error) {
    console.error('Get listing stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve listing statistics',
      error: error.message
    });
  }
};