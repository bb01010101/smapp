# Safe Migration Guide: UploadThing to AWS S3

This guide will help you migrate your image storage from UploadThing to AWS S3 safely and cost-effectively.

## 🎯 Migration Benefits

**Cost Savings:**
- **UploadThing**: ~$0.10-0.20/GB/month + transfer costs
- **AWS S3**: ~$0.023/GB/month (Standard) or $0.0125/GB/month (IA)
- **Estimated Savings**: 80-90% reduction in storage costs

**Performance:**
- Direct S3 access eliminates proxy overhead
- Better caching with CloudFront integration
- Improved upload/download speeds

**Security:**
- Private S3 bucket with presigned URLs for secure access
- No public access to your media files
- Time-limited access URLs (1 hour expiry)

## 📊 Current Setup Analysis

Your app stores images in these database fields:
- `User.image` - Profile pictures
- `Post.image` - Post images/videos
- `Pet.imageUrl` - Pet photos  
- `Pet.evolutionImageUrl` - Pet evolution images (newly added to migration)

## 🔧 Step 1: AWS S3 Setup

### 1.1 Create S3 Bucket

```bash
# Using AWS CLI (install first: aws configure)
aws s3 mb s3://your-app-media-bucket --region us-east-1

# Or use AWS Console: https://console.aws.amazon.com/s3/
```

### 1.2 Configure Bucket (Keep Private)

**Important**: Keep your bucket private for security. Do NOT add any public access policies. The default private settings are perfect.

Your bucket should have:
- ✅ Block all public access: **ENABLED** 
- ✅ Bucket ACLs: **DISABLED**
- ✅ Object ownership: **Bucket owner enforced**

### 1.3 Create IAM User for Application

1. Create IAM user: `your-app-s3-user`
2. Attach policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject", 
        "s3:DeleteObject",
        "s3:PutObjectAcl",
        "s3:GetObjectAttributes"
      ],
      "Resource": "arn:aws:s3:::your-app-media-bucket/*"
    },
    {
      "Sid": "AllowS3BucketListing",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-app-media-bucket"
    }
  ]
}
```

### 1.4 Update Environment Variables

Add to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-app-media-bucket
```

## 🛡️ Step 2: Safety Preparations

### 2.1 Database Backup

**Critical: Create a full database backup before migration**

```bash
# For PostgreSQL
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Or use your hosting provider's backup tools
# Vercel: Use Vercel Storage backup
# Railway: Use Railway backup
# PlanetScale: Use PlanetScale backup
```

### 2.2 Test S3 Configuration

```bash
# Test the migration script functions first
npm run ts-node scripts/migrate-to-s3.ts --dry-run
```

## 📈 Step 3: Migration Execution

### 3.1 Pre-Migration Check

Run this to see migration scope:

```bash
npm run ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkScope() {
  const users = await prisma.user.count({ where: { image: { not: null } } });
  const posts = await prisma.post.count({ where: { image: { not: null } } });
  const pets = await prisma.pet.count({ where: { imageUrl: { not: null } } });
  const evolution = await prisma.pet.count({ where: { evolutionImageUrl: { not: null } } });
  
  console.log('Migration Scope:');
  console.log(\`User images: \${users}\`);
  console.log(\`Post images: \${posts}\`);
  console.log(\`Pet images: \${pets}\`);
  console.log(\`Evolution images: \${evolution}\`);
  console.log(\`Total: \${users + posts + pets + evolution}\`);
  
  await prisma.\$disconnect();
}

checkScope();
"
```

### 3.2 Execute Migration

**Important**: Run during low-traffic hours

```bash
# Execute the migration
npm run ts-node scripts/migrate-to-s3.ts
```

The script will:
- Process images in small batches (10 at a time)
- Retry failed uploads 3 times with exponential backoff
- Skip already migrated S3 URLs
- Provide detailed progress logs
- Validate migration completion

### 3.3 Monitor Progress

Watch for:
- ✅ Successful migrations: `✓ Migrated user/post/pet {id}`
- ❌ Failed migrations: `✗ Failed to migrate...`
- ⏭️ Skipped (already migrated): Auto-skipped S3 URLs

## 🔍 Step 4: Validation & Testing

### 4.1 Verify Migration

```bash
# Check for any remaining UploadThing URLs
npm run ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function validate() {
  const remaining = await Promise.all([
    prisma.user.count({ where: { image: { contains: 'utfs.io' } } }),
    prisma.post.count({ where: { image: { contains: 'utfs.io' } } }),
    prisma.pet.count({ where: { imageUrl: { contains: 'utfs.io' } } }),
    prisma.pet.count({ where: { evolutionImageUrl: { contains: 'utfs.io' } } })
  ]);
  
  console.log('Remaining UploadThing URLs:', remaining.reduce((a, b) => a + b, 0));
  await prisma.\$disconnect();
}

validate();
"
```

### 4.2 Test Application

1. **Image Display**: Check that all images load correctly
2. **Upload Functionality**: Test new uploads go to S3
3. **User Experience**: Verify no broken images

### 4.3 Performance Monitoring

Monitor for:
- Page load times
- Image load speeds
- Upload success rates
- Any 404 errors

## 🔄 Step 5: Update Application Code

### 5.1 Switch Upload Components

Your app already has both systems in place:
- `ImageUpload.tsx` (UploadThing) 
- `S3ImageUpload.tsx` (S3)

Update components to use S3:

```typescript
// Replace UploadThing usage with S3
- import { ImageUpload } from '@/components/ImageUpload'
+ import { S3ImageUpload } from '@/components/S3ImageUpload'

// In your forms:
- <ImageUpload endpoint="postImage" onChange={setMedia} value={media} />
+ <S3ImageUpload onChange={setMedia} value={media} folder="posts" />
```

### 5.2 Update API Routes

Your app already uses `/api/upload` for S3. Ensure all upload flows use this endpoint.

## 🧹 Step 6: Cleanup (After Verification)

### 6.1 Remove UploadThing Dependencies

After successful migration and testing:

```bash
npm uninstall uploadthing @uploadthing/react
```

### 6.2 Remove UploadThing Files

```bash
rm -rf src/app/api/uploadthing/
rm src/components/ImageUpload.tsx
rm src/lib/uploadthing.ts
```

### 6.3 Clean Up Environment

Remove from `.env`:
```env
# Remove these after migration
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

## 💰 Cost Optimization Tips

### 6.1 S3 Storage Classes

For older images, consider:
- **Standard-IA**: 40% cost reduction for infrequently accessed files
- **Glacier**: 80% cost reduction for archival

### 6.2 Lifecycle Policies

Set up automatic transitions:
```json
{
  "Rules": [
    {
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### 6.3 CloudFront CDN

Add CloudFront for:
- 50-80% reduction in data transfer costs
- Improved global performance
- Edge caching

## 🚨 Rollback Plan

If issues occur during migration:

### 6.1 Immediate Rollback

1. **Stop Migration**: Kill the migration script
2. **Revert Environment**: Switch back to UploadThing env vars
3. **Deploy Previous Version**: If you updated components

### 6.2 Database Rollback

```bash
# Restore from backup if needed
psql $DATABASE_URL < backup-TIMESTAMP.sql
```

### 6.3 Partial Migration State

The script is designed to be resumable:
- Already migrated files are skipped
- Failed files can be retried
- No data loss occurs

## ✅ Success Checklist

- [ ] AWS S3 bucket created and configured
- [ ] IAM user created with proper permissions
- [ ] Database backup completed
- [ ] Environment variables updated
- [ ] Migration script executed successfully
- [ ] All images loading correctly
- [ ] Upload functionality tested
- [ ] No remaining UploadThing URLs
- [ ] Performance monitoring in place
- [ ] UploadThing dependencies removed (after verification)

## 🆘 Support & Troubleshooting

### Common Issues

**403 Forbidden on S3**
- Check bucket policy for public read access
- Verify IAM user has PutObject permissions

**Images Not Loading**
- Verify S3 URLs are publicly accessible
- Check CloudFront distribution if using CDN

**Migration Failures**
- Check network connectivity
- Verify UploadThing URLs are still accessible
- Review AWS credentials and permissions

**Performance Issues**
- Enable CloudFront for global delivery
- Consider S3 Transfer Acceleration
- Optimize image sizes and formats

Remember: This migration can save you 80-90% on storage costs while improving performance and giving you full control over your media assets. 