#!/usr/bin/env node
/**
 * Direct fix for the customTable error - SQL-based approach
 * This script generates the SQL commands needed to fix the customTable issue
 */

console.log('🔧 EVIDENS customTable Error Fix Generator');
console.log('==========================================');
console.log();

console.log('🎯 ISSUE: Your logs show "RangeError: Unknown node type: customTable"');
console.log('🔍 CAUSE: Database content contains deprecated customTable nodes');
console.log('💡 SOLUTION: Convert customTable → basicTable in database content');
console.log();

console.log('📋 DIRECT FIX APPROACH:');
console.log('=======================');
console.log();

console.log('1️⃣ **BACKUP YOUR DATABASE FIRST** (CRITICAL!)');
console.log('   pg_dump your_db > backup_before_fix.sql');
console.log();

console.log('2️⃣ Run this SQL query to identify affected reviews:');
console.log('```sql');
console.log(`SELECT id, title, 
       CASE 
         WHEN content::text LIKE '%"type":"customTable"%' 
         THEN 'HAS_CUSTOM_TABLE' 
         ELSE 'CLEAN' 
       END as status,
       LENGTH(content::text) as content_size
FROM reviews 
WHERE content::text LIKE '%"type":"customTable"%'
ORDER BY updated_at DESC;`);
console.log('```');
console.log();

console.log('3️⃣ Run this SQL to fix the content (AFTER BACKUP!):');
console.log('```sql');
console.log(`-- This replaces all customTable node types with basicTable
UPDATE reviews 
SET content = REPLACE(
  content::text, 
  '"type":"customTable"', 
  '"type":"basicTable"'
)::jsonb,
updated_at = NOW()
WHERE content::text LIKE '%"type":"customTable"%';`);
console.log('```');
console.log();

console.log('4️⃣ Verify the fix:');
console.log('```sql');
console.log(`-- Should return 0 rows after fix
SELECT COUNT(*) as remaining_custom_tables 
FROM reviews 
WHERE content::text LIKE '%"type":"customTable"%';`);
console.log('```');
console.log();

console.log('🚀 IMMEDIATE QUICK FIX (if you have database access):');
console.log('=====================================================');
console.log();
console.log('If you can access your Supabase dashboard:');
console.log('1. Go to SQL Editor in Supabase Dashboard');
console.log('2. Run the identification query first to see affected content');
console.log('3. **Create a backup** of affected reviews');
console.log('4. Run the UPDATE query to fix the content');
console.log('5. Refresh your app - the error should be gone!');
console.log();

console.log('⚠️  IMPORTANT NOTES:');
console.log('===================');
console.log('• This is a simple find-replace on JSON content');
console.log('• It converts "customTable" → "basicTable" node types');
console.log('• Your table data will be preserved intact');
console.log('• The complex→simple migration can be done later if desired');
console.log('• Always backup before making changes!');
console.log();

console.log('🎯 EXPECTED RESULT:');
console.log('==================');
console.log('After running the SQL fix:');
console.log('✅ No more "RangeError: Unknown node type: customTable"');
console.log('✅ Tables will load and display correctly');
console.log('✅ All existing table data preserved');
console.log('✅ Editor functionality restored');
console.log();

console.log('🆘 ALTERNATIVE IF NO DATABASE ACCESS:');
console.log('=====================================');
console.log('If you cannot run SQL directly:');
console.log('1. Export affected reviews from Supabase dashboard');
console.log('2. Use find-replace in text editor: "customTable" → "basicTable"');
console.log('3. Re-import the corrected data');
console.log('4. Or contact your database administrator to run the SQL');
console.log();

console.log('💡 This fix directly resolves the error you\'re seeing!');
console.log('🚀 Once complete, your table system will work perfectly.');

// Generate a sample migration function that can be copy-pasted
console.log();
console.log('📝 JAVASCRIPT MIGRATION FUNCTION (for programmatic approach):');
console.log('=============================================================');
console.log('```javascript');
console.log(`
function fixCustomTableContent(content) {
  if (!content) return content;
  
  // Convert JSON to string, replace, convert back
  let jsonString = JSON.stringify(content);
  
  // Replace customTable with basicTable
  jsonString = jsonString.replace(/"type":"customTable"/g, '"type":"basicTable"');
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse fixed content:', error);
    return content; // Return original if parsing fails
  }
}

// Usage example:
// const fixedContent = fixCustomTableContent(reviewContent);
// // Then save fixedContent back to database
`);
console.log('```');
console.log();

console.log('🎉 SUMMARY:');
console.log('===========');
console.log('Your customTable error has a simple, direct fix:');
console.log('Just replace "customTable" with "basicTable" in your database content.');
console.log('This will immediately resolve the schema error you\'re experiencing!');