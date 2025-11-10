import AWS from 'aws-sdk';
import { S3 } from 'aws-sdk';

// Configure S3 client with credentials
// For local dev: uses default AWS credentials chain (env vars, ~/.aws/credentials, IAM role)
// Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or use AWS_PROFILE
const s3Config: AWS.S3.ClientConfiguration = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Use profile if specified
if (process.env.AWS_PROFILE) {
  s3Config.credentials = new AWS.SharedIniFileCredentials({ profile: process.env.AWS_PROFILE });
} else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  // Use explicit credentials from environment
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}
// Otherwise, AWS SDK will use default credential chain (IAM role, env vars, ~/.aws/credentials)

const s3 = new S3(s3Config);

// Helper to ensure bucket exists
const ensureBucketExists = async (bucket: string): Promise<void> => {
  try {
    await s3.headBucket({ Bucket: bucket }).promise();
  } catch (error: any) {
    if (error.statusCode === 404 || error.code === 'NotFound') {
      // Bucket doesn't exist, create it
      try {
        await s3.createBucket({
          Bucket: bucket,
          ...(process.env.AWS_REGION !== 'us-east-1' && {
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_REGION || 'us-east-1',
            },
          }),
        }).promise();
        console.log(`Created S3 bucket: ${bucket}`);
      } catch (createError: any) {
        if (createError.code !== 'BucketAlreadyExists') {
          console.error(`Failed to create bucket ${bucket}:`, createError.message);
          throw createError;
        }
      }
    } else {
      throw error;
    }
  }
};

export const uploadToS3 = async (
  bucket: string,
  key: string,
  body: Buffer | string,
  contentType?: string
): Promise<string> => {
  // Ensure bucket exists before uploading
  await ensureBucketExists(bucket);

  const params: S3.PutObjectRequest = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ...(contentType && { ContentType: contentType }),
  };

  await s3.putObject(params).promise();
  return key;
};

export const getFromS3 = async (bucket: string, key: string): Promise<Buffer> => {
  // Ensure bucket exists
  await ensureBucketExists(bucket);

  const params: S3.GetObjectRequest = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const result = await s3.getObject(params).promise();
    if (!result.Body) {
      throw new Error(`S3 object ${key} in bucket ${bucket} has no body`);
    }
    return result.Body as Buffer;
  } catch (error: any) {
    if (error.code === 'NoSuchKey' || error.statusCode === 404) {
      throw new Error(`S3 object not found: ${key} in bucket ${bucket}`);
    }
    if (error.code === 'CredentialsError' || error.message?.includes('credentials')) {
      throw new Error(`AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or configure AWS CLI with 'aws configure'`);
    }
    throw new Error(`Failed to get S3 object ${key} from bucket ${bucket}: ${error.message || error.code || 'Unknown error'}`);
  }
};

export const getPresignedUrl = async (
  bucket: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const params: S3.GetObjectRequest = {
    Bucket: bucket,
    Key: key,
  };

  return s3.getSignedUrlPromise('getObject', {
    ...params,
    Expires: expiresIn,
  });
};

export const deleteFromS3 = async (bucket: string, key: string): Promise<void> => {
  const params: S3.DeleteObjectRequest = {
    Bucket: bucket,
    Key: key,
  };

  await s3.deleteObject(params).promise();
};

export default s3;

