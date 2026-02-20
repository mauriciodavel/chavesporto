// Script to add email tracking columns to key_history table
require('dotenv').config();
const supabase = require('../config/supabase');

async function addEmailColumns() {
  try {
    console.log('\n📧 Adding email tracking columns to key_history...\n');

    // Use raw SQL to add columns
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE key_history
        ADD COLUMN IF NOT EXISTS email_first_alert_sent_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS email_reminder_sent_at TIMESTAMP WITH TIME ZONE;
      `
    });

    if (error) {
      console.error('❌ Error using RPC:', error.message);
      
      // Alternative approach: Use direct SQL through Supabase
      console.log('Trying alternative approach with direct API...');
      
      // Try adding the columns one by one
      const column1 = await supabase
        .from('key_history')
        .select('email_first_alert_sent_at')
        .limit(1);
      
      if (column1.error && column1.error.code === '42703') {
        console.log('Column email_first_alert_sent_at does not exist - need to add it via SQL');
        console.log('\n⚠️  MANUAL STEP REQUIRED:');
        console.log('Please run this SQL in your Supabase console:\n');
        console.log(`
ALTER TABLE public.key_history
ADD COLUMN IF NOT EXISTS email_first_alert_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_reminder_sent_at TIMESTAMP WITH TIME ZONE;
        `);
        console.log('\nOr use the Supabase UI to add these columns as timestamp fields.\n');
        return false;
      }
    }

    console.log('✅ Email columns added successfully!');
    
    // Verify columns exist
    const { data: testData, error: testError } = await supabase
      .from('key_history')
      .select('email_first_alert_sent_at, email_reminder_sent_at')
      .limit(1);
    
    if (testError) {
      console.error('❌ Verification failed:', testError.message);
      return false;
    }

    console.log('✓ Columns verified - system is ready for email alerts!');
    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

addEmailColumns();
