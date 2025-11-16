/**
 * Analyze storage usage and find files to clean up
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTMyMTIsImV4cCI6MjA3MzI2OTIxMn0._B9fXNzIgIvCUpH6_4Wkt3YZ5pbCffMadldBdeEBUFQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeStorage() {
  try {
    console.log('🔍 Analyzing storage usage...\n');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }

    if (buckets.length === 0) {
      console.log('📦 No storage buckets found');
      return;
    }

    let totalSize = 0;
    const bucketStats = [];

    for (const bucket of buckets) {
      console.log(`\n📦 Analyzing bucket: ${bucket.name}`);

      try {
        // List all files recursively
        const { data: files, error: listError } = await supabase.storage
          .from(bucket.name)
          .list('', {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (listError) {
          console.log(`   ⚠️  Cannot access bucket (might need auth): ${listError.message}`);
          continue;
        }

        if (!files || files.length === 0) {
          console.log('   Empty bucket');
          continue;
        }

        // Calculate stats
        const filesByType = {};
        let bucketSize = 0;

        for (const file of files) {
          const size = file.metadata?.size || 0;
          bucketSize += size;

          const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
          if (!filesByType[ext]) {
            filesByType[ext] = { count: 0, size: 0 };
          }
          filesByType[ext].count++;
          filesByType[ext].size += size;
        }

        totalSize += bucketSize;

        console.log(`   Total files: ${files.length}`);
        console.log(`   Total size: ${(bucketSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Breakdown by type:`);

        Object.entries(filesByType)
          .sort((a, b) => b[1].size - a[1].size)
          .forEach(([ext, stats]) => {
            console.log(`     - .${ext}: ${stats.count} files, ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          });

        bucketStats.push({
          name: bucket.name,
          fileCount: files.length,
          size: bucketSize,
          files: files.slice(0, 10) // Keep top 10 for reference
        });

      } catch (err) {
        console.log(`   ⚠️  Error analyzing bucket: ${err.message}`);
      }
    }

    console.log('\n\n📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total storage used: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Storage limit: 1024 MB (1 GB)`);
    console.log(`Usage: ${((totalSize / 1024 / 1024 / 1024) * 100).toFixed(1)}%`);
    console.log(`Available: ${(1024 - (totalSize / 1024 / 1024)).toFixed(2)} MB`);

    if (bucketStats.length > 0) {
      console.log('\n💡 Recommendations:');
      bucketStats.forEach(bucket => {
        if (bucket.size > 100 * 1024 * 1024) { // > 100MB
          console.log(`\n   Bucket "${bucket.name}" is large (${(bucket.size / 1024 / 1024).toFixed(2)} MB)`);
          console.log(`   - Contains ${bucket.fileCount} files`);
          console.log(`   - Consider cleaning up old/unused files`);
        }
      });
    }

    console.log('\n🔧 Next steps:');
    console.log('   1. Identify which files are no longer needed');
    console.log('   2. Delete old/test files from Supabase Dashboard');
    console.log('   3. Switch to MP3 format for new audio (saves 90% space)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeStorage();
