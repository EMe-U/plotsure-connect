const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import model definitions
const User = require('./User')(sequelize, DataTypes);
const Listing = require('./Listing')(sequelize, DataTypes);
const Inquiry = require('./Inquiry')(sequelize, DataTypes);
const Contact = require('./Contact')(sequelize, DataTypes);
const Document = require('./Document')(sequelize, DataTypes);
const Media = require('./Media')(sequelize, DataTypes);
const ActivityLog = require('./ActivityLog')(sequelize);

// Define associations
User.hasMany(Listing, {
    foreignKey: 'user_id',
    as: 'listings'
});

Listing.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'broker'
});

Listing.hasMany(Inquiry, {
    foreignKey: 'listing_id',
    as: 'inquiries'
});

Inquiry.belongsTo(Listing, {
    foreignKey: 'listing_id',
    as: 'listing'
});

// Document associations
Listing.hasMany(Document, {
    foreignKey: 'listing_id',
    as: 'documents'
});

Document.belongsTo(Listing, {
    foreignKey: 'listing_id',
    as: 'listing'
});

// Media associations
Listing.hasMany(Media, {
    foreignKey: 'listing_id',
    as: 'media'
});

Media.belongsTo(Listing, {
    foreignKey: 'listing_id',
    as: 'listing'
});

// Add association
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Export models and sequelize instance
module.exports = {
    sequelize,
    User,
    Listing,
    Inquiry,
    Contact,
    Document,
    Media,
    ActivityLog
};