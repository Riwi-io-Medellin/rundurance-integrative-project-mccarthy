const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.S3_BUCKET;

/**
 * Uploads a .FIT file to S3.
 * Key: fit/{athleteId}/{YYYY-MM-DD}_{originalFilename}
 *
 * @param {Buffer} buffer
 * @param {number} athleteId
 * @param {string} filename - original filename from multer
 * @returns {Promise<string>} s3_key
 */
async function uploadFitFile(buffer, athleteId, filename) {
  const date = new Date().toISOString().slice(0, 10);
  const key = `fit/${athleteId}/${date}_${filename}`;

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/octet-stream',
  }));

  return key;
}

/**
 * Uploads a .ZWO file to S3.
 * Key: zwo/{planId}/{originalFilename}
 *
 * @param {Buffer} buffer
 * @param {number} planId
 * @param {string} filename
 * @returns {Promise<string>} s3_key
 */
async function uploadZwoFile(buffer, planId, filename) {
  const key = `zwo/${planId}/${filename}`;

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/xml',
  }));

  return key;
}

/**
 * Generates a presigned URL to read a private S3 object.
 *
 * @param {string} s3Key
 * @param {number} expiresIn - seconds until expiry (default 1 hour)
 * @returns {Promise<string>} presigned URL
 */
async function getPresignedUrl(s3Key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
  return getSignedUrl(client, command, { expiresIn });
}

module.exports = { uploadFitFile, uploadZwoFile, getPresignedUrl };
