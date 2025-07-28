import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config();

const prisma = new PrismaClient();

async function checkMigrationScope() {
  try {
    console.log('🔍 Checking Migration Scope...\n');

    // Count images by type
    const [users, posts, pets, evolution] = await Promise.all([
      prisma.user.count({ where: { image: { not: null } } }),
      prisma.post.count({ where: { image: { not: null } } }),
      prisma.pet.count({ where: { imageUrl: { not: null } } }),
      prisma.pet.count({ where: { evolutionImageUrl: { not: null } } })
    ]);

    // Count already migrated to S3
    const [usersMigrated, postsMigrated, petsMigrated, evolutionMigrated] = await Promise.all([
      prisma.user.count({ where: { image: { contains: 's3.amazonaws.com' } } }),
      prisma.post.count({ where: { image: { contains: 's3.amazonaws.com' } } }),
      prisma.pet.count({ where: { imageUrl: { contains: 's3.amazonaws.com' } } }),
      prisma.pet.count({ where: { evolutionImageUrl: { contains: 's3.amazonaws.com' } } })
    ]);

    // Count remaining UploadThing URLs (both old and new domains)
    const [usersRemaining, postsRemaining, petsRemaining, evolutionRemaining] = await Promise.all([
      prisma.user.count({ 
        where: { 
          OR: [
            { image: { contains: 'utfs.io' } },
            { image: { contains: 'ufs.sh' } }
          ]
        } 
      }),
      prisma.post.count({ 
        where: { 
          OR: [
            { image: { contains: 'utfs.io' } },
            { image: { contains: 'ufs.sh' } }
          ]
        } 
      }),
      prisma.pet.count({ 
        where: { 
          OR: [
            { imageUrl: { contains: 'utfs.io' } },
            { imageUrl: { contains: 'ufs.sh' } }
          ]
        } 
      }),
      prisma.pet.count({ 
        where: { 
          OR: [
            { evolutionImageUrl: { contains: 'utfs.io' } },
            { evolutionImageUrl: { contains: 'ufs.sh' } }
          ]
        } 
      })
    ]);

    console.log('📊 Current Image Storage Overview:');
    console.log('=====================================');
    console.log(`👥 User Images:           ${users.toString().padStart(6)} total | ${usersMigrated.toString().padStart(4)} on S3 | ${usersRemaining.toString().padStart(4)} on UploadThing`);
    console.log(`📱 Post Images:           ${posts.toString().padStart(6)} total | ${postsMigrated.toString().padStart(4)} on S3 | ${postsRemaining.toString().padStart(4)} on UploadThing`);
    console.log(`🐕 Pet Images:            ${pets.toString().padStart(6)} total | ${petsMigrated.toString().padStart(4)} on S3 | ${petsRemaining.toString().padStart(4)} on UploadThing`);
    console.log(`🧬 Pet Evolution Images:  ${evolution.toString().padStart(6)} total | ${evolutionMigrated.toString().padStart(4)} on S3 | ${evolutionRemaining.toString().padStart(4)} on UploadThing`);
    console.log('=====================================');

    const totalImages = users + posts + pets + evolution;
    const totalMigrated = usersMigrated + postsMigrated + petsMigrated + evolutionMigrated;
    const totalRemaining = usersRemaining + postsRemaining + petsRemaining + evolutionRemaining;

    console.log(`📈 Migration Status:`);
    console.log(`   Total Images:     ${totalImages}`);
    console.log(`   Already on S3:    ${totalMigrated} (${totalImages > 0 ? Math.round((totalMigrated / totalImages) * 100) : 0}%)`);
    console.log(`   Need Migration:   ${totalRemaining}`);

    if (totalRemaining === 0) {
      console.log('\n✅ All images already migrated to S3!');
    } else {
      console.log(`\n🎯 Migration Required:`);
      console.log(`   ${totalRemaining} images need to be migrated from UploadThing to S3`);
      
      // Estimate data size (rough approximation)
      const avgImageSize = 2; // MB average
      const estimatedSize = totalRemaining * avgImageSize;
      console.log(`   Estimated data: ~${estimatedSize}MB (${(estimatedSize / 1024).toFixed(1)}GB)`);
      
      // Cost estimates
      const uploadThingCost = estimatedSize * 0.1 / 1024; // $0.1/GB/month
      const s3Cost = estimatedSize * 0.023 / 1024; // $0.023/GB/month
      const savings = uploadThingCost - s3Cost;
      
      console.log(`\n💰 Cost Analysis (monthly):`);
      console.log(`   UploadThing: ~$${uploadThingCost.toFixed(2)}`);
      console.log(`   AWS S3:      ~$${s3Cost.toFixed(2)}`);
      console.log(`   Savings:     ~$${savings.toFixed(2)} (${Math.round((savings / uploadThingCost) * 100)}%)`);
    }

    // Check for any unusual URLs (not UploadThing, S3, or Clerk)
    const [usersOther, postsOther, petsOther, evolutionOther] = await Promise.all([
      prisma.user.count({ 
        where: { 
          AND: [
            { image: { not: null } },
            { image: { not: { contains: 'utfs.io' } } },
            { image: { not: { contains: 'ufs.sh' } } },
            { image: { not: { contains: 's3.amazonaws.com' } } },
            { image: { not: { contains: 'img.clerk.com' } } }
          ]
        } 
      }),
      prisma.post.count({ 
        where: { 
          AND: [
            { image: { not: null } },
            { image: { not: { contains: 'utfs.io' } } },
            { image: { not: { contains: 'ufs.sh' } } },
            { image: { not: { contains: 's3.amazonaws.com' } } }
          ]
        } 
      }),
      prisma.pet.count({ 
        where: { 
          AND: [
            { imageUrl: { not: null } },
            { imageUrl: { not: { contains: 'utfs.io' } } },
            { imageUrl: { not: { contains: 'ufs.sh' } } },
            { imageUrl: { not: { contains: 's3.amazonaws.com' } } }
          ]
        } 
      }),
      prisma.pet.count({ 
        where: { 
          AND: [
            { evolutionImageUrl: { not: null } },
            { evolutionImageUrl: { not: { contains: 'utfs.io' } } },
            { evolutionImageUrl: { not: { contains: 'ufs.sh' } } },
            { evolutionImageUrl: { not: { contains: 's3.amazonaws.com' } } }
          ]
        } 
      })
    ]);

    const totalOther = usersOther + postsOther + petsOther + evolutionOther;
    if (totalOther > 0) {
      console.log(`\n⚠️  Found ${totalOther} images with unusual URLs (not UploadThing or S3)`);
      console.log('   These will be skipped during migration. Review manually if needed.');
    }

    console.log('\n🚀 Next Steps:');
    if (totalRemaining > 0) {
      console.log('   1. Follow the MIGRATION_GUIDE.md for detailed instructions');
      console.log('   2. Set up AWS S3 bucket and credentials');
      console.log('   3. Create database backup');
      console.log('   4. Run: npm run ts-node scripts/migrate-to-s3.ts');
    } else {
      console.log('   1. Verify all images are loading correctly');
      console.log('   2. Update upload components to use S3');
      console.log('   3. Remove UploadThing dependencies');
    }

  } catch (error) {
    console.error('❌ Error checking migration scope:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkMigrationScope();
}

export { checkMigrationScope }; 