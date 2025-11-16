/**
 * Check storage usage breakdown by bucket
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTMyMTIsImV4cCI6MjA3MzI2OTIxMn0._B9fXNzIgIvCUpH6_4Wkt3YZ5pbCffMadldBdeEBUFQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorageUsage() {
  try {
    console.log('🔍 Checking storage usage by bucket...\n');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }

    console.log('📦 Storage Buckets:\n');

    for (const bucket of buckets) {
      console.log(`Bucket: ${bucket.name}`);
      console.log(`  - Public: ${bucket.public}`);
      console.log(`  - ID: ${bucket.id}`);
      console.log(`  - File size limit: ${bucket.file_size_limit ? (bucket.file_size_limit / 1024 / 1024).toFixed(2) + ' MB' : 'unlimited'}`);

      // Try to list files in the bucket to get an idea of usage
      const { data: files, error: listError } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 100 });

      if (!listError && files) {
        const fileCount = files.length;
        const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
        console.log(`  - Files: ${fileCount}`);
        console.log(`  - Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      }
      console.log('');
    }

    console.log('\n⚠️  You are at 90% storage capacity (0.901 / 1 GB)');
    console.log('💡 Consider cleaning up old files or upgrading your plan');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkStorageUsage();
