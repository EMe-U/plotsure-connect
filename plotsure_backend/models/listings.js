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
        notEmpty: { msg: 'Listing title is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Description is required' }
      }
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Bugesera'
    },
    sector: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    cell: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    village: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    price_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Price cannot be negative' }
      }
    },
    price_currency: {
      type: DataTypes.ENUM('RWF', 'USD'),
      defaultValue: 'RWF'
    },
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
    broker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'reserved', 'sold', 'withdrawn'),
      defaultValue: 'draft'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
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
    has_road_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    has_electricity: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_water: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    landowner_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    landowner_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    landowner_id_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    tableName: 'listings',
    timestamps: true
  });

  return Listing;
};