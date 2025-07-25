const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const BUCKET = process.env.AWS_S3_BUCKET;

module.exports = {
  s3,
  BUCKET,
  uploadFile: async (buffer, key, mimetype) => {
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read'
    };
    return s3.upload(params).promise();
  },
  deleteFile: async (key) => {
    const params = {
      Bucket: BUCKET,
      Key: key
    };
    return s3.deleteObject(params).promise();
  },
  getPublicUrl: (key) => `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}; 