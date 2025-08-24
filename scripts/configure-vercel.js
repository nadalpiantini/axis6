#!/usr/bin/env node

/**
 * AXIS6 Vercel Domain Configuration Script
 * Configures domain and redirects in Vercel
 */

require('dotenv').config({ path: '.env.local' });

const VERCEL_CONFIG = {
  projectName: 'axis6',
  domain: 'axis6.app',
  redirects: [
    {
      source: 'www.axis6.app',
      destination: 'axis6.app',
      permanent: true // 301 redirect
    }
  ]
};

class VercelDomainManager {
  constructor(token, teamId = null) {
    this.token = token;
    this.teamId = teamId;
    this.baseUrl = 'https://api.vercel.com';
  }

  async getProject(projectName) {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    const response = await fetch(`${this.baseUrl}/v9/projects/${projectName}${teamQuery}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get project: ${response.statusText}`);
    }

    return await response.json();
  }

  async listDomains(projectId) {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    const response = await fetch(`${this.baseUrl}/v9/projects/${projectId}/domains${teamQuery}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list domains: ${response.statusText}`);
    }

    const data = await response.json();
    return data.domains || [];
  }

  async addDomain(projectId, domain) {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    const response = await fetch(`${this.baseUrl}/v10/projects/${projectId}/domains${teamQuery}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: domain
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add domain: ${error}`);
    }

    return await response.json();
  }

  async verifyDomain(domain) {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    const response = await fetch(`${this.baseUrl}/v9/domains/${domain}/verify${teamQuery}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`Domain verification pending: ${error}`);
      return false;
    }

    return true;
  }

  async updateProjectSettings(projectId, settings) {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    const response = await fetch(`${this.baseUrl}/v9/projects/${projectId}${teamQuery}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error(`Failed to update project settings: ${response.statusText}`);
    }

    return await response.json();
  }

  async configureDomain() {
    console.log('🚀 Configuring Vercel domain for axis6.app...\n');

    try {
      // Get project
      const project = await this.getProject(VERCEL_CONFIG.projectName);
      console.log(`✅ Found project: ${project.name} (ID: ${project.id})`);

      // List existing domains
      const existingDomains = await this.listDomains(project.id);
      console.log(`📋 Existing domains: ${existingDomains.map(d => d.name).join(', ') || 'none'}\n`);

      // Add main domain if not exists
      const mainDomain = existingDomains.find(d => d.name === VERCEL_CONFIG.domain);
      if (!mainDomain) {
        console.log(`🔧 Adding domain: ${VERCEL_CONFIG.domain}`);
        await this.addDomain(project.id, VERCEL_CONFIG.domain);
        console.log(`  ✅ Domain added successfully`);
      } else {
        console.log(`  ℹ️ Domain ${VERCEL_CONFIG.domain} already configured`);
      }

      // Add www subdomain if not exists
      const wwwDomain = `www.${VERCEL_CONFIG.domain}`;
      const wwwExists = existingDomains.find(d => d.name === wwwDomain);
      if (!wwwExists) {
        console.log(`🔧 Adding www subdomain: ${wwwDomain}`);
        await this.addDomain(project.id, wwwDomain);
        console.log(`  ✅ WWW subdomain added successfully`);
      } else {
        console.log(`  ℹ️ WWW subdomain already configured`);
      }

      // Verify domains
      console.log('\n🔍 Verifying domains...');
      const mainVerified = await this.verifyDomain(VERCEL_CONFIG.domain);
      const wwwVerified = await this.verifyDomain(wwwDomain);
      
      if (mainVerified && wwwVerified) {
        console.log('  ✅ All domains verified');
      } else {
        console.log('  ⏳ Domain verification pending (DNS propagation may take time)');
      }

      // Configure redirects
      console.log('\n🔄 Configuring redirects...');
      const redirectRules = [
        {
          source: '/(.*)',
          has: [
            {
              type: 'host',
              value: 'www.axis6.app'
            }
          ],
          destination: 'https://axis6.app/$1',
          permanent: true
        }
      ];

      await this.updateProjectSettings(project.id, {
        redirects: redirectRules
      });
      console.log('  ✅ Redirect from www.axis6.app → axis6.app configured');

      console.log('\n🎉 Vercel domain configuration complete!');
      console.log('\nConfiguration summary:');
      console.log('- Main domain: axis6.app');
      console.log('- WWW redirect: www.axis6.app → axis6.app (301)');
      console.log('- SSL certificates: Auto-provisioned by Vercel');

    } catch (error) {
      console.error('❌ Error configuring Vercel domain:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) {
    console.error('❌ Missing required environment variable: VERCEL_TOKEN');
    process.exit(1);
  }

  const manager = new VercelDomainManager(token, teamId);
  await manager.configureDomain();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VercelDomainManager, VERCEL_CONFIG };