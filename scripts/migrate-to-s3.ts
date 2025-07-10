import { PrismaClient } from '@prisma/client';
import { uploadToS3, extractS3KeyFromUrl } from '../src/lib/s3';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
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

  // Skip if not an UploadThing URL
  if (!url.includes('utfs.io')) {
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
  
  for (const user of users) {
    if (!user.image) continue;
    
    try {
      if (user.image.includes('s3.amazonaws.com')) {
        stats.skipped++;
        continue;
      }
      
      const newUrl = await migrateUrl(user.image, 'users');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { image: newUrl }
      });
      
      stats.migrated++;
    } catch (error) {
      console.error(`Failed to migrate user ${user.id}:`, error);
      stats.failed++;
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
  
  for (const post of posts) {
    if (!post.image) continue;
    
    try {
      if (post.image.includes('s3.amazonaws.com')) {
        stats.skipped++;
        continue;
      }
      
      const folder = post.mediaType === 'video' ? 'videos' : 'posts';
      const newUrl = await migrateUrl(post.image, folder);
      
      await prisma.post.update({
        where: { id: post.id },
        data: { image: newUrl }
      });
      
      stats.migrated++;
    } catch (error) {
      console.error(`Failed to migrate post ${post.id}:`, error);
      stats.failed++;
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
  
  for (const pet of pets) {
    if (!pet.imageUrl) continue;
    
    try {
      if (pet.imageUrl.includes('s3.amazonaws.com')) {
        stats.skipped++;
        continue;
      }
      
      const newUrl = await migrateUrl(pet.imageUrl, 'pets');
      
      await prisma.pet.update({
        where: { id: pet.id },
        data: { imageUrl: newUrl }
      });
      
      stats.migrated++;
    } catch (error) {
      console.error(`Failed to migrate pet ${pet.id}:`, error);
      stats.failed++;
    }
  }
  
  return stats;
}

async function main() {
  console.log('Starting migration from UploadThing to S3...');
  
  try {
    const userStats = await migrateUserImages();
    const postStats = await migratePostImages();
    const petStats = await migratePetImages();
    
    console.log('\n=== Migration Summary ===');
    console.log('User Images:', userStats);
    console.log('Post Images:', postStats);
    console.log('Pet Images:', petStats);
    
    const totalStats = {
      total: userStats.total + postStats.total + petStats.total,
      migrated: userStats.migrated + postStats.migrated + petStats.migrated,
      failed: userStats.failed + postStats.failed + petStats.failed,
      skipped: userStats.skipped + postStats.skipped + petStats.skipped,
    };
    
    console.log('\nTotal:', totalStats);
    console.log('\nMigration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
} 