module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('Media', {
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
        media_type: {
            type: DataTypes.ENUM('image', 'video'),
            allowNull: false
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        file_path: {
            type: DataTypes.STRING(500),
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
        is_primary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        caption: {
            type: DataTypes.STRING(500),
            allowNull: true
        }
    }, {
        tableName: 'media',
        timestamps: true,
        underscored: true
    });

    return Media;
};