module.exports = (sequelize, DataTypes) => {
    const Contact = sequelize.define('Contact', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
            allowNull: true
        },
        subject: {
            type: DataTypes.ENUM(
                'general-inquiry',
                'plot-interest',
                'broker-services',
                'technical-support',
                'partnership'
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
        status: {
            type: DataTypes.ENUM('new', 'read', 'responded', 'archived'),
            defaultValue: 'new'
        },
        response: {
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
        }
    }, {
        tableName: 'contacts',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['status']
            },
            {
                fields: ['email']
            }
        ]
    });

    return Contact;
};