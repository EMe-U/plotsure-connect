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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        inquiry_type: {
            type: DataTypes.ENUM(
                'general_interest',
                'site_visit',
                'price_negotiation',
                'document_verification',
                'purchase_intent',
                'reservation'
            ),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
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
        timeframe: {
            type: DataTypes.ENUM(
                'flexible',
                'immediate',
                'within_month',
                'within_3months',
                'within_6months'
            ),
            defaultValue: 'flexible'
        },
        is_diaspora: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        status: {
            type: DataTypes.ENUM('new', 'in_progress', 'responded', 'closed'),
            defaultValue: 'new'
        },
        assigned_to: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        response_date: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'inquiries',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['status']
            },
            {
                fields: ['email']
            },
            {
                fields: ['listing_id']
            }
        ]
    });

    return Inquiry;
};