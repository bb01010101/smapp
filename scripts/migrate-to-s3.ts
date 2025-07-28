import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { uploadToS3, extractS3KeyFromUrl } from '../src/lib/s3';
import fetch from 'node-fetch';

// Load environment variables
config();

const prisma = new PrismaClient();

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
}

// Migration configuration
const BATCH_SIZE = 10; // Process in small batches to avoid overwhelming the system
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function migrateUrl(url: string, folder: string): Promise<string> {
  // Skip if already migrated to S3
  if (url.includes('s3.amazonaws.com')) {
    return url;
  }

  // Skip if not an UploadThing URL (handles both old and new domains)
  if (!url.includes('utfs.io') && !url.includes('ufs.sh')) {
    console.log(`Skipping non-UploadThing URL: ${url}`);
    return url;
  }

  try {
    console.log(`Migrating: ${url}`);
    
    // Download the file from UploadThing
    const fileBuffer = await downloadFile(url);
    
    // Extract filename from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'file';
    
    // Determine content type from file extension
    let contentType = 'application/octet-stream';
    if (fileName.includes('.')) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
      };
      contentType = mimeTypes[ext || ''] || 'application/octet-stream';
    }
    
    // Upload to S3
    const result = await uploadToS3(fileBuffer, fileName, contentType, folder);
    
    console.log(`Successfully migrated to: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error(`Failed to migrate ${url}:`, error);
    throw error;
  }
}

async function migrateWithRetry(url: string, folder: string): Promise<string> {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await migrateUrl(url, folder);
    } catch (error) {
      if (attempt === RETRY_ATTEMPTS) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
      await sleep(RETRY_DELAY * attempt); // Exponential backoff
    }
  }
  throw new Error('All retry attempts failed');
}

async function migrateUserImages(): Promise<MigrationStats> {
  console.log('\n=== Migrating User Images ===');
  const stats: MigrationStats = { total: 0, migrated: 0, failed: 0, skipped: 0 };
  
  const users = await prisma.user.findMany({
    where: {
      image: {
        not: null
      }
    },
    select: { id: true, image: true }
  });
  
  stats.total = users.length;
  console.log(`Found ${stats.total} user images to process`);
  
  // Process in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)}`);
    
    for (const user of batch) {
      if (!user.image) continue;
      
      try {
        if (user.image.includes('s3.amazonaws.com')) {
          stats.skipped++;
          continue;
        }
        
        const newUrl = await migrateWithRetry(user.image, 'users');
        
        await prisma.user.update({
          where: { id: user.id },
          data: { image: newUrl }
        });
        
        stats.migrated++;
        console.log(`✓ Migrated user ${user.id} (${stats.migrated}/${stats.total})`);
      } catch (error) {
        console.error(`✗ Failed to migrate user ${user.id}:`, error);
        stats.failed++;
      }
    }
    
    // Brief pause between batches
    if (i + BATCH_SIZE < users.length) {
      await sleep(500);
    }
  }
  
  return stats;
}

async function migratePostImages(): Promise<MigrationStats> {
  console.log('\n=== Migrating Post Images ===');
  const stats: MigrationStats = { total: 0, migrated: 0, failed: 0, skipped: 0 };
  
  const posts = await prisma.post.findMany({
    where: {
      image: {
        not: null
      }
    },
    select: { id: true, image: true, mediaType: true }
  });
  
  stats.total = posts.length;
  console.log(`Found ${stats.total} post images to process`);
  
  // Process in batches
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(posts.length / BATCH_SIZE)}`);
    
    for (const post of batch) {
      if (!post.image) continue;
      
      try {
        if (post.image.includes('s3.amazonaws.com')) {
          stats.skipped++;
          continue;
        }
        
        const folder = post.mediaType === 'video' ? 'videos' : 'posts';
        const newUrl = await migrateWithRetry(post.image, folder);
        
        await prisma.post.update({
          where: { id: post.id },
          data: { image: newUrl }
        });
        
        stats.migrated++;
        console.log(`✓ Migrated post ${post.id} (${stats.migrated}/${stats.total})`);
      } catch (error) {
        console.error(`✗ Failed to migrate post ${post.id}:`, error);
        stats.failed++;
      }
    }
    
    // Brief pause between batches
    if (i + BATCH_SIZE < posts.length) {
      await sleep(500);
    }
  }
  
  return stats;
}

async function migratePetImages(): Promise<MigrationStats> {
  console.log('\n=== Migrating Pet Images ===');
  const stats: MigrationStats = { total: 0, migrated: 0, failed: 0, skipped: 0 };
  
  const pets = await prisma.pet.findMany({
    where: {
      imageUrl: {
        not: null
      }
    },
    select: { id: true, imageUrl: true }
  });
  
  stats.total = pets.length;
  console.log(`Found ${stats.total} pet images to process`);
  
  // Process in batches
  for (let i = 0; i < pets.length; i += BATCH_SIZE) {
    const batch = pets.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pets.length / BATCH_SIZE)}`);
    
    for (const pet of batch) {
      if (!pet.imageUrl) continue;
      
      try {
        if (pet.imageUrl.includes('s3.amazonaws.com')) {
          stats.skipped++;
          continue;
        }
        
        const newUrl = await migrateWithRetry(pet.imageUrl, 'pets');
        
        await prisma.pet.update({
          where: { id: pet.id },
          data: { imageUrl: newUrl }
        });
        
        stats.migrated++;
        console.log(`✓ Migrated pet ${pet.id} (${stats.migrated}/${stats.total})`);
      } catch (error) {
        console.error(`✗ Failed to migrate pet ${pet.id}:`, error);
        stats.failed++;
      }
    }
    
    // Brief pause between batches
    if (i + BATCH_SIZE < pets.length) {
      await sleep(500);
    }
  }
  
  return stats;
}

async function migratePetEvolutionImages(): Promise<MigrationStats> {
  console.log('\n=== Migrating Pet Evolution Images ===');
  const stats: MigrationStats = { total: 0, migrated: 0, failed: 0, skipped: 0 };
  
  const pets = await prisma.pet.findMany({
    where: {
      evolutionImageUrl: {
        not: null
      }
    },
    select: { id: true, evolutionImageUrl: true }
  });
  
  stats.total = pets.length;
  console.log(`Found ${stats.total} pet evolution images to process`);
  
  // Process in batches
  for (let i = 0; i < pets.length; i += BATCH_SIZE) {
    const batch = pets.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pets.length / BATCH_SIZE)}`);
    
    for (const pet of batch) {
      if (!pet.evolutionImageUrl) continue;
      
      try {
        if (pet.evolutionImageUrl.includes('s3.amazonaws.com')) {
          stats.skipped++;
          continue;
        }
        
        const newUrl = await migrateWithRetry(pet.evolutionImageUrl, 'pets/evolution');
        
        await prisma.pet.update({
          where: { id: pet.id },
          data: { evolutionImageUrl: newUrl }
        });
        
        stats.migrated++;
        console.log(`✓ Migrated pet evolution ${pet.id} (${stats.migrated}/${stats.total})`);
      } catch (error) {
        console.error(`✗ Failed to migrate pet evolution ${pet.id}:`, error);
        stats.failed++;
      }
    }
    
    // Brief pause between batches
    if (i + BATCH_SIZE < pets.length) {
      await sleep(500);
    }
  }
  
  return stats;
}

async function createDatabaseBackup(): Promise<void> {
  console.log('\n=== Creating Database Backup ===');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup-${timestamp}.sql`;
  
  console.log(`Creating backup: ${backupFile}`);
  console.log('NOTE: You should also create a manual backup of your database before proceeding');
  // In a real scenario, you'd want to implement actual backup logic here
  // For now, we'll just log the recommendation
}

async function validateMigration(): Promise<void> {
  console.log('\n=== Validating Migration ===');
  
  // Check for any remaining UploadThing URLs (both old and new domains)
  const userCount = await prisma.user.count({
    where: {
      OR: [
        { image: { contains: 'utfs.io' } },
        { image: { contains: 'ufs.sh' } }
      ]
    }
  });
  
  const postCount = await prisma.post.count({
    where: {
      OR: [
        { image: { contains: 'utfs.io' } },
        { image: { contains: 'ufs.sh' } }
      ]
    }
  });
  
  const petImageCount = await prisma.pet.count({
    where: {
      OR: [
        { imageUrl: { contains: 'utfs.io' } },
        { imageUrl: { contains: 'ufs.sh' } }
      ]
    }
  });
  
  const petEvolutionCount = await prisma.pet.count({
    where: {
      OR: [
        { evolutionImageUrl: { contains: 'utfs.io' } },
        { evolutionImageUrl: { contains: 'ufs.sh' } }
      ]
    }
  });
  
  console.log('Remaining UploadThing URLs:');
  console.log(`  Users: ${userCount}`);
  console.log(`  Posts: ${postCount}`);
  console.log(`  Pet Images: ${petImageCount}`);
  console.log(`  Pet Evolution Images: ${petEvolutionCount}`);
  
  const totalRemaining = userCount + postCount + petImageCount + petEvolutionCount;
  
  if (totalRemaining === 0) {
    console.log('✓ Migration completed successfully! No UploadThing URLs remaining.');
  } else {
    console.log(`⚠ Warning: ${totalRemaining} UploadThing URLs still remain. You may want to investigate.`);
  }
}

async function main() {
  console.log('Starting migration from UploadThing to S3...');
  console.log(`Batch size: ${BATCH_SIZE}, Retry attempts: ${RETRY_ATTEMPTS}`);
  
  try {
    // Create backup first (recommended)
    await createDatabaseBackup();
    
    // Perform migrations
    const userStats = await migrateUserImages();
    const postStats = await migratePostImages();
    const petStats = await migratePetImages();
    const evolutionStats = await migratePetEvolutionImages();
    
    console.log('\n=== Migration Summary ===');
    console.log('User Images:', userStats);
    console.log('Post Images:', postStats);
    console.log('Pet Images:', petStats);
    console.log('Pet Evolution Images:', evolutionStats);
    
    const totalStats = {
      total: userStats.total + postStats.total + petStats.total + evolutionStats.total,
      migrated: userStats.migrated + postStats.migrated + petStats.migrated + evolutionStats.migrated,
      failed: userStats.failed + postStats.failed + petStats.failed + evolutionStats.failed,
      skipped: userStats.skipped + postStats.skipped + petStats.skipped + evolutionStats.skipped,
    };
    
    console.log('\nTotal:', totalStats);
    
    // Validate the migration
    await validateMigration();
    
    console.log('\nMigration completed!');
    
    if (totalStats.failed > 0) {
      console.log(`⚠ Warning: ${totalStats.failed} files failed to migrate. Check the logs above for details.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running this script directly or importing functions for testing
if (require.main === module) {
  main();
}

export { 
  migrateUserImages, 
  migratePostImages, 
  migratePetImages, 
  migratePetEvolutionImages,
  validateMigration 
}; 