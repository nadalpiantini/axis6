#!/usr/bin/env node

/**
 * AXIS6 Resend Email Configuration Script
 * Sets up email domain and retrieves DNS records
 */

require('dotenv').config({ path: '.env.local' });

const RESEND_CONFIG = {
  domain: 'axis6.app',
  fromEmail: 'noreply@axis6.app',
  replyToEmail: 'support@axis6.app',
  region: 'us-east-1' // AWS SES region
};

class ResendEmailManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.resend.com';
  }

  async listDomains() {
    const response = await fetch(`${this.baseUrl}/domains`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list domains: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  async createDomain(domain) {
    const response = await fetch(`${this.baseUrl}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: domain,
        region: RESEND_CONFIG.region
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create domain: ${error}`);
    }

    return await response.json();
  }

  async getDomainDetails(domainId) {
    const response = await fetch(`${this.baseUrl}/domains/${domainId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get domain details: ${response.statusText}`);
    }

    return await response.json();
  }

  async verifyDomain(domainId) {
    const response = await fetch(`${this.baseUrl}/domains/${domainId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`Domain verification pending: ${error}`);
      return false;
    }

    const data = await response.json();
    return data.object === 'domain' && data.status === 'verified';
  }

  async createApiKey(name) {
    const response = await fetch(`${this.baseUrl}/api-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        permission: 'full_access',
        domain_id: null // Full access to all domains
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create API key: ${error}`);
    }

    return await response.json();
  }

  async sendTestEmail(from, to) {
    const response = await fetch(`${this.baseUrl}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: from,
        to: [to],
        subject: 'AXIS6 Email Configuration Test',
        html: `
          <h1>AXIS6 Email Test</h1>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p>If you received this email, your Resend configuration is successful!</p>
          <hr>
          <p><small>Sent from AXIS6 - Your wellness tracking companion</small></p>
        `,
        text: 'AXIS6 Email Test\n\nThis is a test email to verify that your email configuration is working correctly.\n\nIf you received this email, your Resend configuration is successful!'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send test email: ${error}`);
    }

    return await response.json();
  }

  async configureEmail() {
    console.log('📧 Configuring Resend email for axis6.app...\n');

    try {
      // List existing domains
      const existingDomains = await this.listDomains();
      console.log(`📋 Found ${existingDomains.length} existing domain(s)`);

      // Check if domain exists
      let domain = existingDomains.find(d => d.name === RESEND_CONFIG.domain);
      
      if (!domain) {
        console.log(`\n🔧 Creating domain: ${RESEND_CONFIG.domain}`);
        const result = await this.createDomain(RESEND_CONFIG.domain);
        domain = result.data;
        console.log(`  ✅ Domain created with ID: ${domain.id}`);
      } else {
        console.log(`  ℹ️ Domain ${RESEND_CONFIG.domain} already exists (ID: ${domain.id})`);
      }

      // Get domain details with DNS records
      console.log('\n📝 Retrieving DNS records...');
      const domainDetails = await this.getDomainDetails(domain.id);
      
      // Display DNS records to configure
      console.log('\n🔐 DNS Records to configure in Cloudflare:');
      console.log('=' .repeat(60));
      
      if (domainDetails.records) {
        // SPF Record
        const spfRecord = domainDetails.records.find(r => r.record && r.record.includes('spf1'));
        if (spfRecord) {
          console.log('\n📌 SPF Record:');
          console.log(`  Type: TXT`);
          console.log(`  Name: @`);
          console.log(`  Value: ${spfRecord.value}`);
        }

        // DKIM Records
        const dkimRecords = domainDetails.records.filter(r => r.name && r.name.includes('._domainkey'));
        if (dkimRecords.length > 0) {
          console.log('\n📌 DKIM Records:');
          dkimRecords.forEach((record, index) => {
            console.log(`  DKIM ${index + 1}:`);
            console.log(`    Type: ${record.type}`);
            console.log(`    Name: ${record.name}`);
            console.log(`    Value: ${record.value}`);
          });
        }

        // MX Records
        const mxRecords = domainDetails.records.filter(r => r.type === 'MX');
        if (mxRecords.length > 0) {
          console.log('\n📌 MX Records:');
          mxRecords.forEach(record => {
            console.log(`  Type: MX`);
            console.log(`  Name: ${record.name || '@'}`);
            console.log(`  Value: ${record.value}`);
            console.log(`  Priority: ${record.priority || 10}`);
          });
        }
      }

      // DMARC Record (standard)
      console.log('\n📌 DMARC Record (recommended):');
      console.log(`  Type: TXT`);
      console.log(`  Name: _dmarc`);
      console.log(`  Value: v=DMARC1; p=none; rua=mailto:dmarc@${RESEND_CONFIG.domain}; ruf=mailto:dmarc@${RESEND_CONFIG.domain}; sp=none; aspf=r;`);

      console.log('\n' + '=' .repeat(60));

      // Check verification status
      console.log('\n🔍 Checking domain verification status...');
      const isVerified = await this.verifyDomain(domain.id);
      
      if (isVerified) {
        console.log('  ✅ Domain is verified and ready to send emails');
        
        // Optionally send a test email
        console.log('\n📤 Sending test email...');
        try {
          const testResult = await this.sendTestEmail(
            RESEND_CONFIG.fromEmail,
            'test@example.com' // Replace with actual test email
          );
          console.log(`  ✅ Test email sent successfully (ID: ${testResult.id})`);
        } catch (error) {
          console.log(`  ⚠️ Test email skipped: ${error.message}`);
        }
      } else {
        console.log('  ⏳ Domain verification pending');
        console.log('     Please configure the DNS records above in Cloudflare');
        console.log('     Verification usually takes 1-24 hours');
      }

      console.log('\n🎉 Resend email configuration complete!');
      console.log('\nNext steps:');
      console.log('1. Add the DNS records above to Cloudflare');
      console.log('2. Wait for DNS propagation (usually 1-24 hours)');
      console.log('3. Run this script again to verify the domain');
      console.log('4. Update Supabase email templates to use Resend');

      // Save configuration for Supabase
      const config = {
        domain: RESEND_CONFIG.domain,
        fromEmail: RESEND_CONFIG.fromEmail,
        replyToEmail: RESEND_CONFIG.replyToEmail,
        apiKey: this.apiKey,
        domainId: domain.id,
        status: isVerified ? 'verified' : 'pending_verification'
      };

      return config;

    } catch (error) {
      console.error('❌ Error configuring Resend email:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('❌ Missing required environment variable: RESEND_API_KEY');
    console.error('\nTo get a Resend API key:');
    console.error('1. Sign up at https://resend.com');
    console.error('2. Go to API Keys section');
    console.error('3. Create a new API key with full access');
    console.error('4. Add it to your .env.local file');
    process.exit(1);
  }

  const manager = new ResendEmailManager(apiKey);
  const config = await manager.configureEmail();
  
  // Save config for other scripts
  const fs = require('fs');
  fs.writeFileSync(
    'scripts/resend-config.json',
    JSON.stringify(config, null, 2)
  );
  console.log('\n💾 Configuration saved to scripts/resend-config.json');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ResendEmailManager, RESEND_CONFIG };