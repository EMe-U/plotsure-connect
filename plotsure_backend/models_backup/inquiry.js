module.exports = (sequelize, DataTypes) => {
  const Inquiry = sequelize.define('Inquiry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    listing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'listings',
        key: 'id'
      }
    },
    // Inquirer details
    inquirer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Inquirer name is required' },
        len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' }
      }
    },
    inquirer_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: { msg: 'Please enter a valid email address' },
        notEmpty: { msg: 'Email is required' }
      }
    },
    inquirer_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Phone number is required' }
      }
    },
    inquirer_location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    is_diaspora: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preferred_contact: {
      type: DataTypes.ENUM('email', 'phone', 'whatsapp'),
      defaultValue: 'email'
    },
    // Inquiry details
    inquiry_type: {
      type: DataTypes.ENUM('general_interest', 'site_visit', 'price_negotiation', 'document_verification', 'purchase_intent', 'reservation'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Inquiry message is required' },
        len: { args: [10, 2000], msg: 'Message must be between 10 and 2000 characters' }
      }
    },
    budget_min: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: { args: 0, msg: 'Budget cannot be negative' }
      }
    },
    budget_max: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: { args: 0, msg: 'Budget cannot be negative' }
      }
    },
    budget_currency: {
      type: DataTypes.ENUM('RWF', 'USD'),
      defaultValue: 'RWF'
    },
    timeframe: {
      type: DataTypes.ENUM('immediate', 'within_month', 'within_3months', 'within_6months', 'flexible'),
      defaultValue: 'flexible'
    },
    visit_preference: {
      type: DataTypes.ENUM('physical_visit', 'virtual_tour', 'video_call', 'not_needed'),
      defaultValue: 'physical_visit'
    },
    // Status and assignment
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'in_progress', 'responded', 'closed', 'converted'),
      defaultValue: 'new'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Follow up
    next_follow_up_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    follow_up_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reminder_set: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Source and tracking
    source: {
      type: DataTypes.ENUM('website', 'referral', 'social_media', 'direct', 'advertisement'),
      defaultValue: 'website'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referrer: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // Response tracking
    first_response_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_response_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    response_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Conversion tracking
    converted_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    conversion_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    // Additional notes
    internal_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'inquiries',
    timestamps: true,
    indexes: [
      { fields: ['listing_id'] },
      { fields: ['inquirer_email'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['assigned_to'] },
      { fields: ['inquiry_type'] },
      { fields: ['created_at'] },
      { fields: ['next_follow_up_date'] }
    ]
  });

  // Virtual fields
  Inquiry.prototype.getAgeInHours = function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
  };

  Inquiry.prototype.getAgeInDays = function() {
    return Math.floor(this.getAgeInHours() / 24);
  };

  // Instance methods
  Inquiry.prototype.updateStatus = async function(newStatus) {
    this.status = newStatus;
    return await this.save();
  };

  Inquiry.prototype.assignTo = async function(brokerId) {
    this.assigned_to = brokerId;
    if (this.status === 'new') {
      this.status = 'contacted';
    }
    return await this.save();
  };

  Inquiry.prototype.addResponse = async function() {
    this.response_count += 1;
    this.last_response_date = new Date();
    
    if (!this.first_response_date) {
      this.first_response_date = new Date();
    }
    
    if (this.status === 'new' || this.status === 'contacted') {
      this.status = 'responded';
    }
    
    return await this.save();
  };

  Inquiry.prototype.setFollowUp = async function(followUpDate, notes = null) {
    this.next_follow_up_date = followUpDate;
    if (notes) this.follow_up_notes = notes;
    this.reminder_set = true;
    return await this.save();
  };

  Inquiry.prototype.markConverted = async function(conversionValue = null) {
    this.status = 'converted';
    this.converted_date = new Date();
    if (conversionValue) this.conversion_value = conversionValue;
    return await this.save();
  };

  Inquiry.prototype.setPriority = async function(priority) {
    this.priority = priority;
    return await this.save();
  };

  // Class methods
  Inquiry.findByStatus = function(status) {
    return this.findAll({
      where: { status },
      order: [['created_at', 'DESC']]
    });
  };

  Inquiry.findByListing = function(listingId) {
    return this.findAll({
      where: { listing_id: listingId },
      order: [['created_at', 'DESC']]
    });
  };

  Inquiry.findByBroker = function(brokerId) {
    return this.findAll({
      where: { assigned_to: brokerId },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  };

  Inquiry.findPending = function() {
    return this.findAll({
      where: {
        status: ['new', 'contacted', 'in_progress']
      },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  };

  Inquiry.findDueForFollowUp = function() {
    return this.findAll({
      where: {
        next_follow_up_date: {
          [sequelize.Op.lte]: new Date()
        },
        status: ['contacted', 'in_progress', 'responded']
      },
      order: [['next_follow_up_date', 'ASC']]
    });
  };

  Inquiry.findByPriority = function(priority) {
    return this.findAll({
      where: { priority },
      order: [['created_at', 'DESC']]
    });
  };

  return Inquiry;
};