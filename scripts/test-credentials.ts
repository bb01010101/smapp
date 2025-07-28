import { config } from 'dotenv';
import { S3Client, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3';

// Load environment variables
config();

async function testCredentials() {
  console.log('🔐 Testing AWS Credentials...\n');

  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.AWS_S3_BUCKET_NAME!;

  try {
    // Test 1: Check if bucket exists and we have access
    console.log('1️⃣ Testing bucket access...');
    const headCommand = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(headCommand);
    console.log(`   ✅ Can access bucket: ${bucketName}`);

    // Test 2: Try to list objects (basic read permission)
    console.log('\n2️⃣ Testing list objects permission...');
    const listCommand = new ListObjectsV2Command({ 
      Bucket: bucketName,
      MaxKeys: 1
    });
    const listResult = await s3Client.send(listCommand);
    console.log(`   ✅ Can list objects (found ${listResult.KeyCount || 0} objects)`);

    console.log('\n🎉 Credentials are valid and have basic S3 access!');
    console.log('The upload error might be related to specific permissions.');
    console.log('\nTrying a minimal upload test...');

    // Test 3: Try the most basic upload possible
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: `test/simple-${Date.now()}.txt`,
      Body: 'test content',
      ContentType: 'text/plain'
    });

    await s3Client.send(putCommand);
    console.log('✅ Basic upload successful!');

  } catch (error) {
    console.error('\n❌ Credential test failed:', error);
    
    if (error instanceof Error) {
      const errorCode = (error as any).$metadata?.httpStatusCode;
      const errorName = error.name;
      
      console.log(`\nError details:`);
      console.log(`  Name: ${errorName}`);
      console.log(`  Status: ${errorCode}`);
      
      if (errorCode === 403) {
        console.log('\n💡 403 Forbidden - Check IAM permissions:');
        console.log('   • s3:ListBucket permission');
        console.log('   • s3:PutObject permission');
        console.log('   • s3:GetObject permission');
      } else if (errorCode === 404) {
        console.log('\n💡 404 Not Found - Check:');
        console.log('   • Bucket name spelling');
        console.log('   • Bucket exists in the correct region');
      } else if (errorName === 'CredentialsProviderError') {
        console.log('\n💡 Credentials issue - Check:');
        console.log('   • AWS_ACCESS_KEY_ID is correct');
        console.log('   • AWS_SECRET_ACCESS_KEY is correct');
        console.log('   • IAM user exists and is active');
      }
    }
  }
}

if (require.main === module) {
  testCredentials();
}

export { testCredentials }; 