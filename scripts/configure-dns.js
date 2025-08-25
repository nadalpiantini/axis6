#!/usr/bin/env node

/**
 * AXIS6 DNS Configuration Script
 * Configures DNS records in Cloudflare to point to Vercel deployment
 * Note: Cloudflare is used ONLY for DNS management, not for hosting
 */

require('dotenv').config({ path: '.env.local' });

const DNS_CONFIG = {
  domain: 'axis6.app',
  records: [
    {
      type: 'A',
      name: '@',
      content: '76.76.21.21', // Vercel IP
      proxied: false,
      ttl: 1 // Auto
    },
    {
      type: 'CNAME',
      name: 'www',
      content: 'axis6.app',
      proxied: false,
      ttl: 1
    },
    // SPF record for email
    {
      type: 'TXT',
      name: '@',
      content: 'v=spf1 include:amazonses.com ~all',
      ttl: 1
    },
    // DMARC record
    {
      type: 'TXT',
      name: '_dmarc',
      content: 'v=DMARC1; p=none; rua=mailto:dmarc@axis6.app',
      ttl: 1
    }
  ]
};

class CloudflareDNSManager {
  constructor(apiToken, accountId) {
    this.apiToken = apiToken;
    this.accountId = accountId;
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
  }

  async getZoneId(domain) {
    const response = await fetch(`${this.baseUrl}/zones?name=${domain}`, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!data.success || data.result.length === 0) {
      throw new Error(`Zone not found for domain: ${domain}`);
    }

    return data.result[0].id;
  }

  async listDNSRecords(zoneId) {
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.success ? data.result : [];
  }

  async createDNSRecord(zoneId, record) {
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Failed to create DNS record: ${JSON.stringify(data.errors)}`);
    }

    return data.result;
  }

  async updateDNSRecord(zoneId, recordId, record) {
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Failed to update DNS record: ${JSON.stringify(data.errors)}`);
    }

    return data.result;
  }

  async configureDNS() {
    console.log('🌐 Configuring DNS records in Cloudflare (pointing to Vercel)...\n');

    try {
      // Get zone ID
      const zoneId = await this.getZoneId(DNS_CONFIG.domain);
      console.log(`✅ Found zone ID: ${zoneId}`);

      // Get existing records
      const existingRecords = await this.listDNSRecords(zoneId);
      console.log(`📋 Found ${existingRecords.length} existing DNS records\n`);

      // Process each required record
      for (const record of DNS_CONFIG.records) {
        const recordName = record.name === '@' ? DNS_CONFIG.domain : `${record.name}.${DNS_CONFIG.domain}`;
        console.log(`🔧 Processing ${record.type} record for ${recordName}`);

        // Check if record exists
        const existing = existingRecords.find(r => 
          r.type === record.type && 
          (r.name === recordName || (record.name === '@' && r.name === DNS_CONFIG.domain))
        );

        if (existing) {
          // Update existing record
          if (existing.content !== record.content) {
            await this.updateDNSRecord(zoneId, existing.id, {
              type: record.type,
              name: record.name,
              content: record.content,
              proxied: record.proxied || false,
              ttl: record.ttl || 1
            });
            console.log(`  ✅ Updated ${record.type} record: ${existing.content} → ${record.content}`);
          } else {
            console.log(`  ℹ️ Record already configured correctly`);
          }
        } else {
          // Create new record
          await this.createDNSRecord(zoneId, {
            type: record.type,
            name: record.name,
            content: record.content,
            proxied: record.proxied || false,
            ttl: record.ttl || 1
          });
          console.log(`  ✅ Created new ${record.type} record`);
        }
      }

      console.log('\n🎉 DNS configuration complete!');
      console.log('\nDNS Records configured:');
      console.log('- A @ → 76.76.21.21 (Vercel)');
      console.log('- CNAME www → axis6.app');
      console.log('- TXT @ (SPF record)');
      console.log('- TXT _dmarc (DMARC record)');

    } catch (error) {
      console.error('❌ Error configuring DNS:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    console.error('❌ Missing required environment variables:');
    if (!apiToken) console.error('  - CLOUDFLARE_API_TOKEN');
    if (!accountId) console.error('  - CLOUDFLARE_ACCOUNT_ID');
    process.exit(1);
  }

  const manager = new CloudflareDNSManager(apiToken, accountId);
  await manager.configureDNS();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CloudflareDNSManager, DNS_CONFIG };