import { Metadata } from 'next'
import Link from 'next/link'

import { LogoFull } from '@/components/ui/Logo'

export const metadata: Metadata = {
  title: 'Privacy Policy - AXIS6',
  description: 'Privacy policy for the AXIS6 wellness tracking platform',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <LogoFull size="xl" className="h-16" />
        </div>
        
        <Link 
          href="/" 
          className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-8"
        >
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        
        <div className="space-y-6 text-gray-300 glass rounded-2xl p-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">1. Information We Collect</h2>
            <p className="mb-3">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account information (name, email address, password)</li>
              <li>Wellness tracking data (daily check-ins, mood ratings, personal notes)</li>
              <li>Profile preferences and settings</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">2. How We Use Your Information</h2>
            <p className="mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain the AXIS6 service</li>
              <li>Personalize your experience and track your wellness progress</li>
              <li>Send you important notifications about your account</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Improve and develop new features</li>
              <li>Ensure the security and integrity of our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption methods. We use 
              Supabase for our backend infrastructure, which provides enterprise-grade security 
              including:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>End-to-end encryption for data in transit</li>
              <li>Encryption at rest for stored data</li>
              <li>Row Level Security (RLS) to ensure data isolation</li>
              <li>Regular security audits and compliance certifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or respond to lawful requests</li>
              <li>To protect the rights, safety, and security of AXIS6 and our users</li>
              <li>In connection with a merger, acquisition, or sale of assets (with notice)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">5. Your Data Rights</h2>
            <p className="mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Export your wellness tracking data</li>
              <li><strong>Withdrawal:</strong> Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">6. Cookies and Tracking</h2>
            <p>
              We use essential cookies to maintain your session and preferences. We do not use 
              third-party tracking cookies or advertising networks. You can control cookie settings 
              through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">7. Children's Privacy</h2>
            <p>
              AXIS6 is not intended for users under the age of 13. We do not knowingly collect 
              personal information from children under 13. If you believe we have collected 
              information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your 
              own. We ensure appropriate safeguards are in place to protect your information in 
              accordance with this privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">9. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services 
              and fulfill the purposes outlined in this policy. When you delete your account, we 
              will delete or anonymize your personal information within 30 days, except as required 
              by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">10. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any 
              material changes by email or through the platform. Your continued use of AXIS6 
              after changes indicates acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <div className="mt-3">
              <p>Email: privacy@axis6.app</p>
              <p>Website: https://axis6.app</p>
              <p>Data Protection Officer: dpo@axis6.app</p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              Last updated: December 2024
              <br />
              Version: 1.0
              <br />
              Effective Date: December 1, 2024
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link 
            href="/terms" 
            className="px-6 py-3 glass rounded-full font-semibold hover:bg-white/20 transition-all duration-300"
          >
            Terms & Conditions
          </Link>
          <Link 
            href="/auth/register" 
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}