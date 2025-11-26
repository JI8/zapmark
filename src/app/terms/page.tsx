import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/footer'

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: November 18, 2025</p>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  By accessing and using Zapmark (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Zapmark provides an AI-powered logo generation service that allows users to create, customize, and download logo designs. The Service includes:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Grid-based logo generation (2x2, 3x3, 4x4 formats)</li>
                  <li>Logo variation generation</li>
                  <li>Logo upscaling and enhancement</li>
                  <li>Download capabilities for generated content</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To access certain features of the Service, you may be required to create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Token System and Billing</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our Service operates on a token-based system:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Each operation (grid generation, variation, or upscale) costs 1 token</li>
                  <li>Tokens are provided monthly based on your subscription plan</li>
                  <li>Unused tokens do not roll over to the next billing cycle</li>
                  <li>Additional tokens can be purchased as needed</li>
                  <li>Subscriptions automatically renew unless canceled</li>
                  <li>You may cancel your subscription at any time</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property and Content Ownership</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Your Content:</strong> You retain all rights to logos generated using a paid subscription plan. You may use these logos for any commercial or personal purpose.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Free Trial:</strong> Logos generated during the free trial are for evaluation purposes only. Commercial usage rights are granted upon subscription.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Our Service:</strong> The Zapmark platform, including its design, code, and AI models, remains our exclusive property.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use Policy</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Generate content that is illegal, harmful, or offensive</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Generate content containing hate speech or discrimination</li>
                  <li>Attempt to reverse engineer or exploit the Service</li>
                  <li>Use automated systems to abuse the Service</li>
                  <li>Resell or redistribute generated content as templates</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. AI-Generated Content Disclaimer</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our Service uses artificial intelligence to generate logos. While we strive for quality and originality:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>We cannot guarantee that generated content is entirely unique</li>
                  <li>You are responsible for ensuring your use does not infringe on existing trademarks</li>
                  <li>We recommend conducting trademark searches before commercial use</li>
                  <li>Generated content is provided &quot;as is&quot; without warranties</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Refund Policy</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Due to the nature of AI-generated digital content, we do not offer refunds for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Subscription fees</li>
                  <li>Token purchases</li>
                  <li>Generated content</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We encourage you to use our free trial before subscribing.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Service Modifications and Termination</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We reserve the right to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Modify or discontinue the Service with reasonable notice</li>
                  <li>Update pricing with 30 days notice to existing subscribers</li>
                  <li>Suspend or terminate accounts that violate these terms</li>
                  <li>Change features or functionality of the Service</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To the maximum extent permitted by law, Zapmark shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of the European Union, without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Email: <a href="mailto:support@zapmark.ai" className="text-primary hover:underline">support@zapmark.ai</a>
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
