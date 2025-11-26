import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/footer'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: November 18, 2025</p>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Zapmark (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                  <li><strong>Payment Information:</strong> Billing details processed securely through Stripe (we do not store credit card information)</li>
                  <li><strong>Content:</strong> Logo prompts and descriptions you provide to generate designs</li>
                  <li><strong>Communications:</strong> Messages you send to our support team</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li><strong>Usage Data:</strong> Information about how you use the Service, including features accessed and actions taken</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers</li>
                  <li><strong>Cookies:</strong> We use cookies and similar technologies to maintain your session and preferences</li>
                  <li><strong>Analytics:</strong> Aggregated usage statistics to improve our Service</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the collected information to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Provide, maintain, and improve the Service</li>
                  <li>Process your transactions and manage your subscription</li>
                  <li>Generate AI-powered logos based on your prompts</li>
                  <li>Send you service-related communications and updates</li>
                  <li>Respond to your support requests</li>
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. AI and Data Processing</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When you use our AI logo generation features:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Your prompts are processed by our AI models to generate logos</li>
                  <li>Generated logos are stored in your account for your access</li>
                  <li>We may use anonymized prompts and usage data to improve our AI models</li>
                  <li>We do not sell or share your specific prompts with third parties</li>
                  <li>Generated content belongs to you (for paid subscriptions)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Information Sharing and Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li><strong>Service Providers:</strong> Third-party companies that help us operate the Service (e.g., Stripe for payments, Firebase for hosting)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Data Storage and Security</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your information:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Data is encrypted in transit using SSL/TLS</li>
                  <li>Data is stored securely using Firebase and Google Cloud Platform</li>
                  <li>Access to personal data is restricted to authorized personnel</li>
                  <li>Regular security audits and updates</li>
                  <li>However, no method of transmission over the Internet is 100% secure</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We retain your information for as long as necessary to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Provide the Service to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>After account deletion, we may retain anonymized data for analytics</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Your Rights (GDPR Compliance)</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you are in the European Economic Area, you have the right to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                  <li><strong>Restriction:</strong> Limit how we use your data</li>
                  <li><strong>Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Objection:</strong> Object to processing of your data</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To exercise these rights, contact us at <a href="mailto:privacy@zapmark.ai" className="text-primary hover:underline">privacy@zapmark.ai</a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Maintain your login session</li>
                  <li>Remember your preferences</li>
                  <li>Analyze usage patterns</li>
                  <li>Improve Service performance</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You can control cookies through your browser settings, but this may affect Service functionality.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Posting the new Privacy Policy on this page</li>
                  <li>Updating the &quot;Last updated&quot; date</li>
                  <li>Sending you an email notification for material changes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Email: <a href="mailto:privacy@zapmark.ai" className="text-primary hover:underline">privacy@zapmark.ai</a><br />
                  Support: <a href="mailto:support@zapmark.ai" className="text-primary hover:underline">support@zapmark.ai</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
