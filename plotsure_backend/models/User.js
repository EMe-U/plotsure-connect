module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [6, 255]
            }
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        role: {
            type: DataTypes.ENUM('admin', 'broker'),
            defaultValue: 'broker',
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        license_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['email']
            }
        ]
    });

    // Hash password before saving
    User.beforeCreate(async (user) => {
        if (user.password) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    });

    User.beforeUpdate(async (user) => {
        if (user.changed('password')) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    });

    // Instance method to compare password
    User.prototype.comparePassword = async function(candidatePassword) {
        const bcrypt = require('bcryptjs');
        return await bcrypt.compare(candidatePassword, this.password);
    };

    // Instance method to update last login
    User.prototype.updateLastLogin = async function() {
        this.last_login = new Date();
        await this.save();
    };

    return User;
};