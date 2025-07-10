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
      allowNull: false,
      validate: {
        notEmpty: { msg: 'File name is required' }
      }
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'File path is required' }
      }
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: 1, msg: 'File size must be positive' }
      }
    },
    file_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    caption: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    alt_text: {
      type: DataTypes.STRING(255),
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
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds for videos'
    },
    thumbnail_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Thumbnail image path for videos'
    }
  }, {
    tableName: 'media',
    timestamps: true,
    indexes: [
      { fields: ['listing_id'] },
      { fields: ['media_type'] },
      { fields: ['is_primary'] },
      { fields: ['display_order'] }
    ]
  });

  // Instance methods
  Media.prototype.getFileUrl = function() {
    const folder = this.media_type === 'image' ? 'images' : 'videos';
    return `/uploads/${folder}/${this.file_name}`;
  };

  Media.prototype.getThumbnailUrl = function() {
    if (this.media_type === 'video' && this.thumbnail_path) {
      return `/uploads/images/${this.thumbnail_path}`;
    }
    return this.getFileUrl();
  };

  Media.prototype.setPrimary = async function() {
    // First, remove primary flag from other media of the same listing
    await Media.update(
      { is_primary: false },
      { where: { listing_id: this.listing_id, media_type: this.media_type } }
    );
    
    // Set this media as primary
    this.is_primary = true;
    return await this.save();
  };

  // Class methods
  Media.findByListing = function(listingId, mediaType = null) {
    const where = { listing_id: listingId };
    if (mediaType) where.media_type = mediaType;
    
    return this.findAll({
      where,
      order: [['is_primary', 'DESC'], ['display_order', 'ASC'], ['created_at', 'ASC']]
    });
  };

  Media.findImages = function(listingId) {
    return this.findByListing(listingId, 'image');
  };

  Media.findVideos = function(listingId) {
    return this.findByListing(listingId, 'video');
  };

  Media.findPrimary = function(listingId, mediaType) {
    return this.findOne({
      where: {
        listing_id: listingId,
        media_type: mediaType,
        is_primary: true
      }
    });
  };

  return Media;
};