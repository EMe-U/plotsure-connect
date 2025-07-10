module.exports = (sequelize, DataTypes) => {
  const Listing = sequelize.define('Listing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Listing title is required' },
        len: { args: [5, 200], msg: 'Title must be between 5 and 200 characters' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Description is required' },
        len: { args: [20, 2000], msg: 'Description must be between 20 and 2000 characters' }
      }
    },
    // Location details
    district: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Bugesera'
    },
    sector: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Sector is required' }
      }
    },
    cell: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Cell is required' }
      }
    },
    village: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Village is required' }
      }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      }
    },
    // Price details
    price_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Price cannot be negative' },
        notEmpty: { msg: 'Price is required' }
      }
    },
    price_currency: {
      type: DataTypes.ENUM('RWF', 'USD'),
      defaultValue: 'RWF'
    },
    price_negotiable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Land details
    land_size_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 1, msg: 'Land size must be positive' }
      }
    },
    land_size_unit: {
      type: DataTypes.ENUM('sqm', 'hectares', 'acres'),
      defaultValue: 'sqm'
    },
    land_type: {
      type: DataTypes.ENUM('residential', 'commercial', 'agricultural', 'industrial', 'mixed'),
      allowNull: false
    },
    soil_type: {
      type: DataTypes.ENUM('clay', 'sandy', 'loamy', 'rocky', 'mixed'),
      defaultValue: 'loamy'
    },
    topography: {
      type: DataTypes.ENUM('flat', 'sloped', 'hilly', 'valley'),
      defaultValue: 'flat'
    },
    // Utilities and features
    has_electricity: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_water: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_internet: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_sewerage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_road_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    road_type: {
      type: DataTypes.ENUM('paved', 'gravel', 'dirt'),
      defaultValue: 'dirt'
    },
    has_public_transport: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    near_school: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    near_hospital: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    near_market: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    near_bank: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Landowner details
    landowner_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Landowner name is required' }
      }
    },
    landowner_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Landowner phone is required' }
      }
    },
    landowner_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: { msg: 'Please enter a valid email' }
      }
    },
    landowner_id_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Landowner ID number is required' }
      }
    },
    landowner_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Broker reference
    broker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Status and verification
    status: {
      type: DataTypes.ENUM('draft', 'active', 'reserved', 'sold', 'withdrawn'),
      defaultValue: 'draft'
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
    // Additional fields
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    inquiries_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    listing_reference: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    }
  }, {
    tableName: 'listings',
    timestamps: true,
    indexes: [
      { fields: ['district', 'sector'] },
      { fields: ['price_amount'] },
      { fields: ['land_type'] },
      { fields: ['status'] },
      { fields: ['featured'] },
      { fields: ['broker_id'] },
      { fields: ['created_at'] }
    ],
    hooks: {
      beforeCreate: async (listing) => {
        // Generate unique reference number
        const prefix = 'PSC';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        listing.listing_reference = `${prefix}${timestamp}${random}`;
      }
    }
  });

  // Virtual fields
  Listing.prototype.getFullLocation = function() {
    return `${this.village}, ${this.cell}, ${this.sector}, ${this.district}`;
  };

  // Instance methods
  Listing.prototype.incrementViews = async function() {
    this.views_count += 1;
    return await this.save();
  };

  Listing.prototype.incrementInquiries = async function() {
    this.inquiries_count += 1;
    return await this.save();
  };

  Listing.prototype.setFeatured = async function(featured = true) {
    this.featured = featured;
    return await this.save();
  };

  Listing.prototype.updateStatus = async function(newStatus) {
    this.status = newStatus;
    return await this.save();
  };

  // Class methods
  Listing.findActive = function() {
    return this.findAll({
      where: { status: 'active' },
      order: [['featured', 'DESC'], ['created_at', 'DESC']]
    });
  };

  Listing.findByLocation = function(district, sector) {
    const where = {};
    if (district) where.district = district;
    if (sector) where.sector = sector;
    
    return this.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  };

  Listing.findByPriceRange = function(minPrice, maxPrice, currency = 'RWF') {
    const where = {
      price_currency: currency,
      price_amount: {}
    };
    
    if (minPrice) where.price_amount[sequelize.Op.gte] = minPrice;
    if (maxPrice) where.price_amount[sequelize.Op.lte] = maxPrice;
    
    return this.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  };

  return Listing;
};