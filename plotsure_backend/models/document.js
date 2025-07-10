module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Document name is required' }
      }
    },
    document_type: {
      type: DataTypes.ENUM('title_deed', 'survey_report', 'tax_clearance', 'permit', 'ownership_certificate', 'other'),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'File path is required' }
      }
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: 1, msg: 'File size must be positive' }
      }
    },
    file_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verification_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verification_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'documents',
    timestamps: true,
    indexes: [
      { fields: ['listing_id'] },
      { fields: ['document_type'] },
      { fields: ['is_verified'] }
    ]
  });

  // Instance methods
  Document.prototype.verify = async function(verifiedBy, notes = null) {
    this.is_verified = true;
    this.verified_by = verifiedBy;
    this.verification_date = new Date();
    if (notes) this.verification_notes = notes;
    return await this.save();
  };

  Document.prototype.getFileUrl = function() {
    return `/uploads/documents/${this.file_name}`;
  };

  // Class methods
  Document.findByListing = function(listingId) {
    return this.findAll({
      where: { listing_id: listingId },
      order: [['display_order', 'ASC'], ['created_at', 'ASC']]
    });
  };

  Document.findVerified = function() {
    return this.findAll({
      where: { is_verified: true },
      order: [['verification_date', 'DESC']]
    });
  };

  Document.findByType = function(documentType) {
    return this.findAll({
      where: { document_type: documentType },
      order: [['created_at', 'DESC']]
    });
  };

  return Document;
};