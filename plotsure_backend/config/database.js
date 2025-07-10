const { Sequelize } = require('sequelize');

// Database configuration
const config = {
  development: {
    username: process.env.DB_USER || 'plotsure_user',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'plotsure_connect',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    }
  },
  test: {
    username: process.env.DB_USER || 'plotsure_user',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME + '_test' || 'plotsure_connect_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    }
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(
  config[process.env.NODE_ENV || 'development'].database,
  config[process.env.NODE_ENV || 'development'].username,
  config[process.env.NODE_ENV || 'development'].password,
  config[process.env.NODE_ENV || 'development']
);

module.exports = { sequelize, config };