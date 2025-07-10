module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define('Contact', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: { msg: 'Please enter a valid email address' },
        notEmpty: { msg: 'Email is required' }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    subject: {
      type: DataTypes.ENUM('general-inquiry', 'plot-interest', 'broker-services', 'technical-support', 'partnership'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Message is required' },
        len: { args: [10, 2000], msg: 'Message must be between 10 and 2000 characters' }
      }
    },
    status: {
      type: DataTypes.ENUM('new', 'in_progress', 'responded', 'closed'),
      defaultValue: 'new'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
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
    response_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    responded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    }
  }, {
    tableName: 'contacts',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['subject'] },
      { fields: ['assigned_to'] },
      { fields: ['created_at'] }
    ]
  });

  // Instance methods
  Contact.prototype.updateStatus = async function(newStatus) {
    this.status = newStatus;
    return await this.save();
  };

  Contact.prototype.assignTo = async function(userId) {
    this.assigned_to = userId;
    if (this.status === 'new') {
      this.status = 'in_progress';
    }
    return await this.save();
  };

  Contact.prototype.respond = async function(responseMessage, respondedBy) {
    this.response_message = responseMessage;
    this.responded_by = respondedBy;
    this.responded_at = new Date();
    this.status = 'responded';
    return await this.save();
  };

  Contact.prototype.setPriority = async function(priority) {
    this.priority = priority;
    return await this.save();
  };

  // Class methods
  Contact.findByStatus = function(status) {
    return this.findAll({
      where: { status },
      order: [['created_at', 'DESC']]
    });
  };

  Contact.findBySubject = function(subject) {
    return this.findAll({
      where: { subject },
      order: [['created_at', 'DESC']]
    });
  };

  Contact.findByPriority = function(priority) {
    return this.findAll({
      where: { priority },
      order: [['created_at', 'DESC']]
    });
  };

  Contact.findAssignedTo = function(userId) {
    return this.findAll({
      where: { assigned_to: userId },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  };

  Contact.findPending = function() {
    return this.findAll({
      where: {
        status: ['new', 'in_progress']
      },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  };

  return Contact;
};