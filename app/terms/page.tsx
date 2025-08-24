import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Conditions - AXIS6',
  description: 'Terms and conditions for using the AXIS6 wellness tracking platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link 
          href="/" 
          className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-8"
        >
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Terms and Conditions
        </h1>
        
        <div className="space-y-6 text-gray-300 glass rounded-2xl p-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using AXIS6, you agree to be bound by these Terms and Conditions. 
              If you do not agree with any part of these terms, you may not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">2. Description of Service</h2>
            <p>
              AXIS6 is a wellness tracking platform that helps users maintain balance across six 
              life dimensions: Physical, Mental, Emotional, Social, Spiritual, and Material. 
              The service includes daily check-ins, progress tracking, and analytics features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. 
              You agree to provide accurate and complete information during registration and to 
              update such information to keep it current.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">4. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. We collect and use your personal data only as 
              necessary to provide our services. Your wellness tracking data is encrypted and 
              stored securely. We do not sell or share your personal information with third parties 
              without your consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">5. User Content and Conduct</h2>
            <p>
              You retain ownership of any content you submit to AXIS6. By using the service, 
              you grant us a license to use, store, and display your content as necessary to 
              provide the service. You agree to use AXIS6 responsibly and not to misuse the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">6. Intellectual Property</h2>
            <p>
              The AXIS6 platform, including its design, features, and content, is protected by 
              intellectual property laws. You may not copy, modify, or distribute any part of 
              our service without explicit permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">7. Disclaimer of Warranties</h2>
            <p>
              AXIS6 is provided "as is" without warranties of any kind. We do not guarantee that 
              the service will be uninterrupted or error-free. The wellness tracking features are 
              for informational purposes only and should not replace professional medical advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, AXIS6 shall not be liable for any indirect, 
              incidental, special, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">9. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of 
              significant changes via email or through the platform. Continued use of AXIS6 after 
              changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">10. Termination</h2>
            <p>
              You may terminate your account at any time through the account settings. We reserve 
              the right to suspend or terminate accounts that violate these terms or for any other 
              reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">11. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws. 
              Any disputes arising from these terms shall be resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-white">12. Contact Information</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us at:
              <br />
              Email: support@axis6.app
              <br />
              Website: https://axis6.app
            </p>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              Last updated: December 2024
              <br />
              Version: 1.0
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link 
            href="/auth/register" 
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
          >
            Create Account
          </Link>
          <Link 
            href="/auth/login" 
            className="px-6 py-3 glass rounded-full font-semibold hover:bg-white/20 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}