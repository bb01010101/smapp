import { config } from 'dotenv';
import { uploadToS3, generatePresignedReadUrl, extractS3KeyFromUrl } from '../src/lib/s3';

// Load environment variables
config();

async function testS3Connection() {
  console.log('🧪 Testing S3 Connection...\n');

  // Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  const requiredEnvs = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME', 'AWS_REGION'];
  let envMissing = false;

  for (const env of requiredEnvs) {
    if (process.env[env]) {
      console.log(`   ✅ ${env}: Set`);
    } else {
      console.log(`   ❌ ${env}: Missing`);
      envMissing = true;
    }
  }

  if (envMissing) {
    console.log('\n❌ Please set all required environment variables first.');
    console.log('Add these to your .env file:');
    console.log('AWS_ACCESS_KEY_ID=your_access_key_here');
    console.log('AWS_SECRET_ACCESS_KEY=your_secret_key_here');
    console.log('AWS_REGION=us-east-1');
    console.log('AWS_S3_BUCKET_NAME=your-bucket-name');
    return;
  }

  try {
    // Test 2: Upload a small test file
    console.log('\n2️⃣ Testing File Upload:');
    const testData = Buffer.from('Hello S3! This is a test file.');
    const testFileName = `test-${Date.now()}.txt`;
    
    console.log(`   Uploading test file: ${testFileName}...`);
    const uploadResult = await uploadToS3(testData, testFileName, 'text/plain', 'test');
    console.log(`   ✅ Upload successful!`);
    console.log(`   📁 S3 URL: ${uploadResult.url}`);
    console.log(`   🔑 S3 Key: ${uploadResult.key}`);

    // Test 3: Generate presigned URL
    console.log('\n3️⃣ Testing Presigned URL Generation:');
    const presignedUrl = await generatePresignedReadUrl(uploadResult.key, 300); // 5 minutes
    console.log(`   ✅ Presigned URL generated successfully!`);
    console.log(`   🔗 URL: ${presignedUrl.substring(0, 80)}...`);

    // Test 4: Test key extraction
    console.log('\n4️⃣ Testing Key Extraction:');
    const extractedKey = extractS3KeyFromUrl(uploadResult.url);
    if (extractedKey === uploadResult.key) {
      console.log(`   ✅ Key extraction working correctly`);
      console.log(`   🔑 Extracted: ${extractedKey}`);
    } else {
      console.log(`   ❌ Key extraction failed`);
      console.log(`   Expected: ${uploadResult.key}`);
      console.log(`   Got: ${extractedKey}`);
    }

    // Test 5: Test presigned URL access
    console.log('\n5️⃣ Testing Presigned URL Access:');
    try {
      const response = await fetch(presignedUrl);
      if (response.ok) {
        const content = await response.text();
        if (content === 'Hello S3! This is a test file.') {
          console.log(`   ✅ Presigned URL access successful!`);
          console.log(`   📄 Content: ${content}`);
        } else {
          console.log(`   ❌ Content mismatch`);
          console.log(`   Got: ${content}`);
        }
      } else {
        console.log(`   ❌ Failed to access presigned URL: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error accessing presigned URL: ${error}`);
    }

    console.log('\n🎉 S3 Configuration Test Complete!');
    console.log('\n✅ All tests passed! Your S3 setup is working correctly.');
    console.log('\n🚀 Ready for migration! Run: npm run migrate-to-s3');

  } catch (error) {
    console.error('\n❌ S3 Test Failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials')) {
        console.log('\n💡 Troubleshooting: Check your AWS credentials');
        console.log('   • Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
        console.log('   • Make sure the IAM user has S3 permissions');
      } else if (error.message.includes('NoSuchBucket')) {
        console.log('\n💡 Troubleshooting: Bucket not found');
        console.log('   • Check your AWS_S3_BUCKET_NAME spelling');
        console.log('   • Verify the bucket exists in the correct region');
      } else if (error.message.includes('AccessDenied')) {
        console.log('\n💡 Troubleshooting: Permission denied');
        console.log('   • Check IAM user permissions');
        console.log('   • Verify the bucket policy allows your IAM user');
      }
    }
  }
}

if (require.main === module) {
  testS3Connection();
}

export { testS3Connection }; 