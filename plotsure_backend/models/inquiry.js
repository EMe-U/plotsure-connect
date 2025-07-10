module.exports = (sequelize, DataTypes) => {
  const Inquiry = sequelize.define('Inquiry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    listing_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'listings',
        key: 'id'
      }
    },
    inquirer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' }
      }
    },
    inquirer_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: { msg: 'Valid email is required' }
      }
    },
    inquirer_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
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
    inquiry_type: {
      type: DataTypes.ENUM('general_interest', 'site_visit', 'price_negotiation', 'document_verification', 'purchase_intent', 'reservation'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Message is required' }
      }
    },
    budget_min: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    budget_max: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    budget_currency: {
      type: DataTypes.ENUM('RWF', 'USD'),
      defaultValue: 'RWF'
    },
    timeframe: {
      type: DataTypes.ENUM('immediate', 'within_month', 'within_3months', 'within_6months', 'flexible'),
      defaultValue: 'flexible'
    },
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
    response_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'inquiries',
    timestamps: true
  });

  return Inquiry;
};