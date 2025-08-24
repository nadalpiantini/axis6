#!/usr/bin/env node

/**
 * AXIS6 Supabase Email Configuration Script
 * Configures Supabase Auth to use Resend for emails
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const EMAIL_TEMPLATES = {
  confirmSignup: {
    subject: 'Welcome to AXIS6 - Confirm Your Email',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AXIS6</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2C3E50; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 40px 20px; border: 1px solid #e1e1e1; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 14px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .categories { display: flex; justify-content: space-around; margin: 30px 0; }
    .category { text-align: center; }
    .category-icon { width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to AXIS6</h1>
      <p>Your journey to balanced wellness starts here</p>
    </div>
    <div class="content">
      <h2>Hi there!</h2>
      <p>Thank you for joining AXIS6. We're excited to help you track and balance the six essential dimensions of your wellness journey.</p>
      
      <p>Please confirm your email address to get started:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
      </center>
      
      <div class="categories">
        <div class="category">
          <div class="category-icon" style="background: #A6C26F;"></div>
          <small>Physical</small>
        </div>
        <div class="category">
          <div class="category-icon" style="background: #365D63;"></div>
          <small>Mental</small>
        </div>
        <div class="category">
          <div class="category-icon" style="background: #D36C50;"></div>
          <small>Emotional</small>
        </div>
        <div class="category">
          <div class="category-icon" style="background: #6F3D56;"></div>
          <small>Social</small>
        </div>
        <div class="category">
          <div class="category-icon" style="background: #2C3E50;"></div>
          <small>Spiritual</small>
        </div>
        <div class="category">
          <div class="category-icon" style="background: #C85729;"></div>
          <small>Purpose</small>
        </div>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>
    </div>
    <div class="footer">
      <p>Seis ejes. Un solo tú. No rompas tu Axis.</p>
      <p>&copy; 2024 AXIS6. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
  },
  resetPassword: {
    subject: 'Reset Your AXIS6 Password',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2C3E50; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 40px 20px; border: 1px solid #e1e1e1; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 14px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your AXIS6 password. Click the button below to create a new password:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </center>
      
      <p>If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>
      
      <p>This link will expire in 1 hour for security reasons.</p>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 AXIS6. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
  },
  magicLink: {
    subject: 'Your AXIS6 Magic Link',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magic Link</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2C3E50; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 40px 20px; border: 1px solid #e1e1e1; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 14px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Magic Link</h1>
    </div>
    <div class="content">
      <h2>Sign in to AXIS6</h2>
      <p>Click the button below to sign in to your AXIS6 account:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">Sign In</a>
      </center>
      
      <p>This link will expire in 1 hour for security reasons.</p>
      
      <p>If you didn't request this link, you can safely ignore this email.</p>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 AXIS6. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
  }
};

class SupabaseEmailManager {
  constructor(url, serviceKey, resendApiKey) {
    this.supabase = createClient(url, serviceKey);
    this.resendApiKey = resendApiKey;
    this.projectUrl = url;
  }

  async updateAuthConfig() {
    console.log('🔧 Updating Supabase Auth configuration...\n');

    try {
      // Note: Direct API updates to Supabase Auth config require Management API access
      // For now, we'll generate the configuration that needs to be applied via dashboard
      
      const config = {
        external_email_enabled: true,
        mailer_autoconfirm: false,
        mailer_secure_email_change_enabled: true,
        mailer_double_confirm_changes: true,
        smtp_settings: {
          enable: true,
          host: 'smtp.resend.com',
          port: 587,
          user: 'resend',
          pass: this.resendApiKey,
          sender_name: 'AXIS6',
          sender_email: 'noreply@axis6.app',
          admin_email: 'support@axis6.app'
        }
      };

      console.log('📝 SMTP Configuration for Supabase Dashboard:');
      console.log('=' .repeat(60));
      console.log('Host: smtp.resend.com');
      console.log('Port: 587');
      console.log('Username: resend');
      console.log(`Password: ${this.resendApiKey}`);
      console.log('Sender email: noreply@axis6.app');
      console.log('Sender name: AXIS6');
      console.log('=' .repeat(60));

      return config;

    } catch (error) {
      console.error('❌ Error updating auth config:', error.message);
      throw error;
    }
  }

  async saveEmailTemplates() {
    console.log('\n📧 Saving email templates...\n');

    const fs = require('fs');
    const path = require('path');

    // Create templates directory
    const templatesDir = path.join(process.cwd(), 'supabase', 'email-templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Save each template
    for (const [key, template] of Object.entries(EMAIL_TEMPLATES)) {
      const fileName = `${key}.html`;
      const filePath = path.join(templatesDir, fileName);
      
      fs.writeFileSync(filePath, template.content.trim());
      console.log(`  ✅ Saved ${fileName}`);
    }

    // Save template configuration
    const configPath = path.join(templatesDir, 'config.json');
    const configData = {
      templates: Object.keys(EMAIL_TEMPLATES).reduce((acc, key) => {
        acc[key] = {
          subject: EMAIL_TEMPLATES[key].subject,
          file: `${key}.html`
        };
        return acc;
      }, {}),
      smtp: {
        provider: 'resend',
        from: 'noreply@axis6.app',
        replyTo: 'support@axis6.app'
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`  ✅ Saved configuration to config.json`);
  }

  async testEmailSending() {
    console.log('\n🧪 Testing email configuration...\n');

    try {
      // This would typically send a test email through Supabase Auth
      // For now, we'll just verify the configuration
      
      console.log('  ℹ️ Email testing requires manual verification:');
      console.log('     1. Go to Supabase Dashboard > Authentication > Email Templates');
      console.log('     2. Update SMTP settings with the configuration above');
      console.log('     3. Test by creating a new user or requesting password reset');

      return true;

    } catch (error) {
      console.error('  ❌ Email test failed:', error.message);
      return false;
    }
  }

  async configureEmails() {
    console.log('📧 Configuring Supabase email settings...\n');

    try {
      // Update auth configuration
      const smtpConfig = await this.updateAuthConfig();

      // Save email templates
      await this.saveEmailTemplates();

      // Test configuration
      await this.testEmailSending();

      console.log('\n🎉 Supabase email configuration complete!');
      console.log('\n📋 Manual steps required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/settings/auth');
      console.log('2. Scroll to "SMTP Settings" section');
      console.log('3. Enable "Custom SMTP"');
      console.log('4. Enter the SMTP configuration shown above');
      console.log('5. Save changes');
      console.log('\n6. Go to "Email Templates" tab');
      console.log('7. Update each template with the HTML from supabase/email-templates/');
      console.log('8. Test by creating a new user or requesting password reset');

      return smtpConfig;

    } catch (error) {
      console.error('❌ Error configuring Supabase emails:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey || !resendApiKey) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    if (!resendApiKey) console.error('  - RESEND_API_KEY');
    process.exit(1);
  }

  const manager = new SupabaseEmailManager(supabaseUrl, supabaseKey, resendApiKey);
  await manager.configureEmails();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SupabaseEmailManager, EMAIL_TEMPLATES };