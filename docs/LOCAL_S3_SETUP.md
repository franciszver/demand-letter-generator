# Local S3 Setup Guide

This guide explains how to configure AWS S3 for local development.

## Why S3 is Needed

The application uses AWS S3 to store:
- **Documents**: Original uploaded files (PDF, DOCX, images)
- **Processed files**: Extracted text from documents
- **Draft letters**: Generated and refined letter content
- **Exports**: Word document exports

## Setup Options

### Option 1: Use Real AWS S3 (Recommended for Production-like Testing)

1. **Create an AWS Account** (if you don't have one)
   - Go to https://aws.amazon.com/
   - Sign up for a free tier account (includes 5GB S3 storage)

2. **Create S3 Buckets**
   ```bash
   aws s3 mb s3://demand-letter-generator-dev-documents --region us-east-1
   aws s3 mb s3://demand-letter-generator-dev-processed --region us-east-1
   aws s3 mb s3://demand-letter-generator-dev-exports --region us-east-1
   ```

3. **Configure AWS Credentials**

   **Option A: Using AWS CLI (Recommended)**
   ```bash
   aws configure
   ```
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `us-east-1` (or your preferred region)
   - Default output format: `json`

   **Option B: Using Environment Variables**
   Create a `.env` file in the `backend` directory:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=us-east-1
   ```

   **Option C: Using AWS Profile**
   ```env
   AWS_PROFILE=your_profile_name
   AWS_REGION=us-east-1
   ```

4. **Set Backend Environment Variables**
   In `backend/.env`:
   ```env
   S3_BUCKET_DOCUMENTS=demand-letter-generator-dev-documents
   S3_BUCKET_PROCESSED=demand-letter-generator-dev-processed
   S3_BUCKET_EXPORTS=demand-letter-generator-dev-exports
   AWS_REGION=us-east-1
   ```

### Option 2: Use LocalStack (For Local Development Without AWS)

LocalStack provides a local AWS cloud stack for testing.

1. **Install LocalStack**
   ```bash
   pip install localstack
   # or
   docker pull localstack/localstack
   ```

2. **Start LocalStack**
   ```bash
   localstack start
   # or with Docker
   docker run -d -p 4566:4566 localstack/localstack
   ```

3. **Create Buckets**
   ```bash
   aws --endpoint-url=http://localhost:4566 s3 mb s3://demand-letter-generator-dev-documents
   aws --endpoint-url=http://localhost:4566 s3 mb s3://demand-letter-generator-dev-processed
   aws --endpoint-url=http://localhost:4566 s3 mb s3://demand-letter-generator-dev-exports
   ```

4. **Configure Backend**
   Update `backend/src/config/s3.ts` to use LocalStack endpoint:
   ```typescript
   const s3Config: AWS.S3.ClientConfiguration = {
     region: 'us-east-1',
     endpoint: 'http://localhost:4566',
     s3ForcePathStyle: true,
     credentials: {
       accessKeyId: 'test',
       secretAccessKey: 'test',
     },
   };
   ```

### Option 3: Mock S3 (For Development Without Storage)

For development where you don't need persistent storage, the application will fall back to database content when S3 is unavailable (this is already implemented).

## Troubleshooting

### Error: "AWS credentials not configured"

**Solution:** Set up AWS credentials using one of the methods above.

### Error: "S3 object not found"

**Possible causes:**
1. The file was never uploaded to S3
2. The s3Key in the database doesn't match the actual S3 key
3. The bucket name is incorrect

**Solution:**
- Check that files are being uploaded successfully
- Verify the bucket name in your `.env` file matches the actual bucket
- Check the database `s3_key` field matches what's in S3

### Error: "Access Denied" or "Forbidden"

**Solution:**
- Verify your AWS credentials have S3 permissions
- Check IAM policies allow `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`
- Ensure the bucket exists and you have access

### Testing S3 Connection

Test your S3 setup:
```bash
# List buckets
aws s3 ls

# List objects in a bucket
aws s3 ls s3://demand-letter-generator-dev-processed/

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://demand-letter-generator-dev-processed/test.txt
aws s3 rm s3://demand-letter-generator-dev-processed/test.txt
```

## Environment Variables Reference

Add these to `backend/.env`:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_key_here          # Optional if using AWS CLI profile
AWS_SECRET_ACCESS_KEY=your_secret_here    # Optional if using AWS CLI profile
AWS_PROFILE=default                        # Optional, uses default if not set
AWS_REGION=us-east-1                      # Required

# S3 Bucket Names
S3_BUCKET_DOCUMENTS=demand-letter-generator-dev-documents
S3_BUCKET_PROCESSED=demand-letter-generator-dev-processed
S3_BUCKET_EXPORTS=demand-letter-generator-dev-exports
```

## Notes

- The application will automatically create buckets if they don't exist (if you have permissions)
- For production, use IAM roles instead of access keys
- Never commit AWS credentials to version control
- The `.env` file should be in `.gitignore` (already configured)

