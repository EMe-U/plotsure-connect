const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./User')(sequelize, DataTypes);
const Listing = require('./Listing')(sequelize, DataTypes);
const Document = require('./Document')(sequelize, DataTypes);
const Media = require('./Media')(sequelize, DataTypes);
const Inquiry = require('./Inquiry')(sequelize, DataTypes);
const Contact = require('./Contact')(sequelize, DataTypes);

// Define associations
const db = {
  User,
  Listing,
  Document,
  Media,
  Inquiry,
  Contact,
  sequelize
};

// User associations
User.hasMany(Listing, { foreignKey: 'broker_id', as: 'listings' });
User.hasMany(Inquiry, { foreignKey: 'assigned_to', as: 'assignedInquiries' });

// Listing associations
Listing.belongsTo(User, { foreignKey: 'broker_id', as: 'broker' });
Listing.hasMany(Document, { foreignKey: 'listing_id', as: 'documents', onDelete: 'CASCADE' });
Listing.hasMany(Media, { foreignKey: 'listing_id', as: 'media', onDelete: 'CASCADE' });
Listing.hasMany(Inquiry, { foreignKey: 'listing_id', as: 'inquiries', onDelete: 'CASCADE' });

// Document associations
Document.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });

// Media associations
Media.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });

// Inquiry associations
Inquiry.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });
Inquiry.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedBroker' });

// Initialize associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;