# How to Get AWS Access Keys

This guide walks you through creating AWS Access Keys for your application.

## Prerequisites

- An AWS account (sign up at https://aws.amazon.com/ if you don't have one)
- Access to the AWS Console

## Step-by-Step Instructions

### Step 1: Sign in to AWS Console

1. Go to https://console.aws.amazon.com/
2. Sign in with your AWS account credentials

### Step 2: Navigate to IAM (Identity and Access Management)

1. In the AWS Console search bar at the top, type "IAM"
2. Click on "IAM" from the search results
3. Or go directly to: https://console.aws.amazon.com/iam/

### Step 3: Create Access Keys

1. **Click on your username** in the top-right corner of the AWS Console
2. Select **"Security credentials"** from the dropdown menu
   - Alternatively, you can go to: https://console.aws.amazon.com/iam/home#/security_credentials

3. Scroll down to the **"Access keys"** section

4. Click **"Create access key"** button

5. **Select a use case:**
   - Choose **"Application running outside AWS"** (for local development)
   - Or **"Command Line Interface (CLI)"** if you prefer

6. **Optional:** Add a description tag (e.g., "Demand Letter Generator - Local Dev")

7. Click **"Next"** and then **"Create access key"**

### Step 4: Save Your Credentials

**⚠️ IMPORTANT: This is the ONLY time you'll see the secret access key!**

1. You'll see two values:
   - **Access key ID** (starts with something like `AKIA...`)
   - **Secret access key** (a long string of characters)

2. **Download the credentials** by clicking "Download .csv file" OR copy them manually

3. **Copy the Access key ID** and paste it into your `.env` file:
   ```env
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   ```

4. **Copy the Secret access key** and paste it into your `.env` file:
   ```env
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```

5. Click **"Done"** to close the dialog

### Step 5: Set Up Permissions (Important!)

By default, new access keys have **no permissions**. You need to attach policies:

1. Go back to **IAM** → **Users** (in the left sidebar)
2. Click on your username
3. Click the **"Permissions"** tab
4. Click **"Add permissions"** → **"Attach policies directly"**
5. Search for and select these policies:
   - **AmazonS3FullAccess** (for full S3 access - use for development)
   - Or create a custom policy with only the S3 permissions you need

6. Click **"Next"** and then **"Add permissions"**

### Step 6: Add to Your .env File

Create or edit `backend/.env`:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1

# S3 Bucket Names
S3_BUCKET_DOCUMENTS=demand-letter-generator-dev-documents
S3_BUCKET_PROCESSED=demand-letter-generator-dev-processed
S3_BUCKET_EXPORTS=demand-letter-generator-dev-exports
```

### Step 7: Test Your Credentials

Test that your credentials work:

```bash
# List your S3 buckets
aws s3 ls

# Or test with a specific command
aws sts get-caller-identity
```

If successful, you'll see your AWS account information.

## Security Best Practices

1. **Never commit `.env` files to git** (already in `.gitignore`)
2. **Rotate keys regularly** (every 90 days recommended)
3. **Use least privilege** - only grant the permissions you need
4. **Delete unused keys** - go to Security credentials → Access keys → Delete
5. **Use IAM roles** in production (instead of access keys)

## Troubleshooting

### "Access Denied" Error

**Problem:** Your access key doesn't have S3 permissions.

**Solution:** 
- Go to IAM → Users → Your User → Permissions
- Add `AmazonS3FullAccess` policy (or create a custom policy)

### "Invalid credentials" Error

**Problem:** Wrong access key or secret key.

**Solution:**
- Double-check you copied both keys correctly
- Make sure there are no extra spaces in your `.env` file
- Verify the keys are active in AWS Console

### "Region not found" Error

**Problem:** Wrong AWS region.

**Solution:**
- Set `AWS_REGION=us-east-1` in your `.env` (or your preferred region)
- Make sure your buckets are in the same region

## Alternative: Using AWS CLI Profile

Instead of environment variables, you can use AWS CLI profiles:

1. **Configure AWS CLI:**
   ```bash
   aws configure
   ```
   Enter your Access Key ID, Secret Access Key, and region when prompted.

2. **Use the profile in your .env:**
   ```env
   AWS_PROFILE=default
   AWS_REGION=us-east-1
   ```

## Need Help?

- AWS IAM Documentation: https://docs.aws.amazon.com/IAM/
- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- AWS Support: https://aws.amazon.com/support/

