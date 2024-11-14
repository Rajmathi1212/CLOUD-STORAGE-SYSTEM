import AWS from 'aws-sdk';
import { AwsSingleFileResponseModel } from 'common/awsModel';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

export const uploadFileToS3 = async (
  file: any,
  originalFileName: any,
  bucketName: string
): Promise<AwsSingleFileResponseModel> => {
  const fileName = `${Date.now()}${path.extname(originalFileName)}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${bucketName}/${fileName}`,
    Body: file,
    ContentType: file.mimetype,
  };
  let awsS3 = await s3.upload(params).promise();

  return {
    AWS: awsS3.Location,
    fileName: fileName,
  };
};

export const uploadMultipleFilesToS3 = async (
  files: any[],
  originalFileName: any,
  bucketName: string
): Promise<AwsSingleFileResponseModel[]> => {
  const uploadPromises = files.map((file) => uploadFileToS3(file, originalFileName, bucketName));
  return Promise.all(uploadPromises);
};

export const getSignedUrlForS3 = (fileName: string, bucketName: string) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${bucketName}/${fileName}`,
    Expires: 7 * 24 * 60 * 60, // URL expiry time in seconds (1 year)
  };

  return s3.getSignedUrl('getObject', params);
};
