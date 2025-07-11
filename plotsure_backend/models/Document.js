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
            allowNull: false
        },
        document_type: {
            type: DataTypes.ENUM('land_title', 'ownership_certificate', 'survey_report', 'other'),
            defaultValue: 'other'
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        file_type: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'documents',
        timestamps: true,
        underscored: true
    });

    return Document;
};