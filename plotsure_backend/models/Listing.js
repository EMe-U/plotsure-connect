module.exports = (sequelize, DataTypes) => {
    const Listing = sequelize.define('Listing', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [5, 200]
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        sector: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cell: {
            type: DataTypes.STRING,
            allowNull: true
        },
        village: {
            type: DataTypes.STRING,
            allowNull: true
        },
        plot_size: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0
            }
        },
        plot_size_unit: {
            type: DataTypes.ENUM('sqm', 'hectares', 'acres'),
            defaultValue: 'sqm'
        },
        price: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        price_negotiable: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        land_type: {
            type: DataTypes.ENUM('residential', 'commercial', 'agricultural', 'industrial', 'mixed'),
            allowNull: false
        },
        land_title_available: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        status: {
            type: DataTypes.ENUM('available', 'reserved', 'sold'),
            defaultValue: 'available'
        },
        featured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        views: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        landowner_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        landowner_phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        commission_percentage: {
            type: DataTypes.FLOAT,
            defaultValue: 5.0,
            validate: {
                min: 0,
                max: 100
            }
        },
        plot_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        upi_number: {
            type: DataTypes.STRING,
            allowNull: true
        },

        amenities: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        nearby_facilities: {
            type: DataTypes.JSON,
            defaultValue: []
        }
    }, {
        tableName: 'listings',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['status']
            },
            {
                fields: ['location']
            },
            {
                fields: ['land_type']
            },
            {
                fields: ['price']
            }
        ]
    });

    return Listing;
};