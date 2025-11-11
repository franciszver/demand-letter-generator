/**
 * Resource Verification Utility
 * Tests database and S3 connectivity on startup
 */

import { db } from '../config/database';
import s3, { getFromS3, uploadToS3 } from '../config/s3';

interface ResourceStatus {
  database: {
    connected: boolean;
    error?: string;
  };
  s3: {
    accessible: boolean;
    buckets: {
      documents: boolean;
      processed: boolean;
      exports: boolean;
    };
    error?: string;
  };
  environment: {
    valid: boolean;
    missing: string[];
    warnings: string[];
  };
}

/**
 * Verify database connection
 */
async function verifyDatabase(): Promise<{ connected: boolean; error?: string }> {
  try {
    await db.raw('SELECT 1');
    return { connected: true };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Database connection failed',
    };
  }
}

/**
 * Verify S3 access by checking bucket existence
 */
async function verifyS3(): Promise<{
  accessible: boolean;
  buckets: { documents: boolean; processed: boolean; exports: boolean };
  error?: string;
}> {
  const documentsBucket = process.env.S3_BUCKET_DOCUMENTS || 'demand-letter-generator-dev-documents';
  const processedBucket = process.env.S3_BUCKET_PROCESSED || 'demand-letter-generator-dev-processed';
  const exportsBucket = process.env.S3_BUCKET_EXPORTS || 'demand-letter-generator-dev-exports';

  const buckets = {
    documents: false,
    processed: false,
    exports: false,
  };

  try {
    // Test each bucket
    try {
      await s3.headBucket({ Bucket: documentsBucket }).promise();
      buckets.documents = true;
    } catch (error: any) {
      if (error.code === 'NotFound' || error.statusCode === 404) {
        // Bucket doesn't exist - try to create it
        try {
          await s3.createBucket({ Bucket: documentsBucket }).promise();
          buckets.documents = true;
        } catch (createError: any) {
          // Bucket creation failed - might be permissions
          console.warn(`Could not access/create documents bucket: ${createError.message}`);
        }
      }
    }

    try {
      await s3.headBucket({ Bucket: processedBucket }).promise();
      buckets.processed = true;
    } catch (error: any) {
      if (error.code === 'NotFound' || error.statusCode === 404) {
        try {
          await s3.createBucket({ Bucket: processedBucket }).promise();
          buckets.processed = true;
        } catch (createError: any) {
          console.warn(`Could not access/create processed bucket: ${createError.message}`);
        }
      }
    }

    try {
      await s3.headBucket({ Bucket: exportsBucket }).promise();
      buckets.exports = true;
    } catch (error: any) {
      if (error.code === 'NotFound' || error.statusCode === 404) {
        try {
          await s3.createBucket({ Bucket: exportsBucket }).promise();
          buckets.exports = true;
        } catch (createError: any) {
          console.warn(`Could not access/create exports bucket: ${createError.message}`);
        }
      }
    }

    const allAccessible = buckets.documents && buckets.processed && buckets.exports;
    return {
      accessible: allAccessible,
      buckets,
      ...(allAccessible ? {} : { error: 'One or more S3 buckets are not accessible' }),
    };
  } catch (error: any) {
    return {
      accessible: false,
      buckets,
      error: error.message || 'S3 access verification failed',
    };
  }
}

/**
 * Verify environment variables
 */
function verifyEnvironment(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const required = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  const recommended = [
    'JWT_SECRET',
    'OPENROUTER_API_KEY',
    'S3_BUCKET_DOCUMENTS',
    'S3_BUCKET_PROCESSED',
    'S3_BUCKET_EXPORTS',
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check recommended variables (warnings in production)
  if (process.env.NODE_ENV === 'production') {
    for (const varName of recommended) {
      if (!process.env[varName]) {
        warnings.push(varName);
      }
    }
  }

  // Special checks - JWT_SECRET is now required (no default)
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      missing.push('JWT_SECRET');
    } else {
      warnings.push('JWT_SECRET is not set - authentication will fail');
    }
  }

  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    warnings.push('AWS credentials not configured - S3 may not work');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Verify all resources
 */
export async function verifyResources(): Promise<ResourceStatus> {
  console.log('Verifying resources...');

  const [database, s3Status, environment] = await Promise.all([
    verifyDatabase(),
    verifyS3(),
    Promise.resolve(verifyEnvironment()),
  ]);

  const status: ResourceStatus = {
    database,
    s3: s3Status,
    environment,
  };

  // Log results
  console.log('\n=== Resource Verification Results ===');
  console.log(`Database: ${database.connected ? '✓ Connected' : '✗ Failed'}`);
  if (database.error) {
    console.log(`  Error: ${database.error}`);
  }

  console.log(`S3: ${s3Status.accessible ? '✓ Accessible' : '⚠ Partial/No Access'}`);
  console.log(`  Documents: ${s3Status.buckets.documents ? '✓' : '✗'}`);
  console.log(`  Processed: ${s3Status.buckets.processed ? '✓' : '✗'}`);
  console.log(`  Exports: ${s3Status.buckets.exports ? '✓' : '✗'}`);
  if (s3Status.error) {
    console.log(`  Error: ${s3Status.error}`);
  }

  console.log(`Environment: ${environment.valid ? '✓ Valid' : '✗ Missing Variables'}`);
  if (environment.missing.length > 0) {
    console.log(`  Missing: ${environment.missing.join(', ')}`);
  }
  if (environment.warnings.length > 0) {
    console.log(`  Warnings: ${environment.warnings.join(', ')}`);
  }
  console.log('=====================================\n');

  return status;
}

/**
 * Check if resources are healthy (for health check endpoint)
 */
export async function checkResourceHealth(): Promise<{
  healthy: boolean;
  details: ResourceStatus;
}> {
  const status = await verifyResources();
  const healthy =
    status.database.connected &&
    status.s3.accessible &&
    status.environment.valid;

  return {
    healthy,
    details: status,
  };
}

