import React from 'react';
import { Helmet } from 'react-helmet-async';

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | boing.finance</title>
        <meta name="description" content="Terms of Service for boing.finance. Legal terms for using our DeFi platform on EVM and Solana." />
        <meta name="keywords" content="terms of service, legal, terms and conditions, boing.finance, DEX" />
        <meta property="og:title" content="Terms of Service | boing.finance" />
        <meta property="og:description" content="Terms of Service for boing.finance - Legal terms and conditions for using our cross-chain decentralized exchange platform." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/terms" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service - boing.finance" />
        <meta name="twitter:description" content="Terms of Service for boing.finance - Legal terms and conditions." />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">
                Terms of Service
              </h1>
              <p className="text-xl style={{ color: 'var(--text-secondary)' }} mb-6">
                boing.finance - Cross-Chain Decentralized Exchange
              </p>
              <div className="flex justify-center space-x-4 text-sm style={{ color: 'var(--text-tertiary)' }}">
                <span>Last Updated: January 2025</span>
                <span>•</span>
                <span>Version 1.0</span>
                <span>•</span>
                <span>boing.finance LLC (Florida)</span>
              </div>
            </div>

            {/* Introduction */}
            <div className="rounded-lg p-6 mb-8 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                These Terms of Service ("Terms") govern your use of the boing.finance platform, including our website, 
                decentralized exchange protocol, and related services (collectively, the "Service"). By accessing or 
                using the Service, you agree to be bound by these Terms. If you disagree with any part of these terms, 
                then you may not access the Service.
              </p>
            </div>

            {/* Terms Sections */}
            <div className="space-y-8">
              {/* Acceptance of Terms */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">1. Acceptance of Terms</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  By accessing or using boing.finance, you confirm that you accept these Terms and agree to comply with them. 
                  If you are using the Service on behalf of a company or other legal entity, you represent that you have the 
                  authority to bind such entity to these Terms.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  We may revise these Terms at any time by updating this page. Your continued use of the Service after any 
                  such changes constitutes your acceptance of the new Terms.
                </p>
              </section>

              {/* Description of Service */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">2. Description of Service</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  boing.finance is a decentralized exchange protocol that enables users to:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Trade digital assets on EVM and Solana</li>
                  <li>Provide liquidity to trading pools</li>
                  <li>Bridge assets between EVM and Solana</li>
                  <li>Deploy and manage custom tokens</li>
                  <li>Access analytics and portfolio management tools</li>
                </ul>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  The Service operates entirely on blockchain technology and smart contracts. We do not custody, hold, or 
                  control any user funds or assets.
                </p>
              </section>

              {/* Eligibility */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">3. Eligibility</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  To use the Service, you must:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Be at least 18 years old or the age of majority in your jurisdiction</li>
                  <li>Have the legal capacity to enter into binding agreements</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not be located in a jurisdiction where the Service is prohibited</li>
                  <li>Not be on any sanctions lists or prohibited persons lists</li>
                </ul>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  We reserve the right to refuse service to anyone for any reason at our sole discretion.
                </p>
              </section>

              {/* User Responsibilities */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">4. User Responsibilities</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  You are responsible for:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Maintaining the security of your wallet and private keys</li>
                  <li>Verifying all transaction details before confirmation</li>
                  <li>Understanding the risks associated with DeFi and cryptocurrency trading</li>
                  <li>Complying with all applicable tax obligations</li>
                  <li>Not using the Service for illegal or unauthorized purposes</li>
                  <li>Not attempting to interfere with or disrupt the Service</li>
                </ul>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  You acknowledge that cryptocurrency transactions are irreversible and that you are solely responsible 
                  for any losses resulting from your actions or negligence.
                </p>
              </section>

              {/* Risks and Disclaimers */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">5. Risks and Disclaimers</h2>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Important Risk Disclosures</h3>
                  <ul className="text-red-200 text-sm space-y-1">
                    <li>• Cryptocurrency trading involves substantial risk of loss</li>
                    <li>• Smart contract vulnerabilities may result in loss of funds</li>
                    <li>• Cross-chain bridges carry additional security risks</li>
                    <li>• Market volatility can result in significant price fluctuations</li>
                    <li>• Regulatory changes may affect the legality of certain activities</li>
                  </ul>
                </div>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL 
                  WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS 
                  FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  We do not guarantee that the Service will be uninterrupted, secure, or error-free, or that any 
                  defects will be corrected.
                </p>
              </section>

              {/* Limitation of Liability */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">6. Limitation of Liability</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL BOING.FINANCE, ITS AFFILIATES, DIRECTORS, 
                  OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                  PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, INCURRED BY YOU OR 
                  ANY THIRD PARTY.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE 
                  SHALL NOT EXCEED THE AMOUNT YOU PAID US, IF ANY, IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                </p>
              </section>

              {/* Intellectual Property */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">7. Intellectual Property</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  The Service and its original content, features, and functionality are owned by boing.finance and are 
                  protected by international copyright, trademark, patent, trade secret, and other intellectual property 
                  laws.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written 
                  consent. The boing.finance name and logo are trademarks of boing.finance.
                </p>
              </section>

              {/* Privacy */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">8. Privacy</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the 
                  Service, to understand our practices regarding the collection and use of your information.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  By using the Service, you consent to the collection and use of information in accordance with our 
                  Privacy Policy.
                </p>
              </section>

              {/* Termination */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">9. Termination</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We may terminate or suspend your access to the Service immediately, without prior notice or liability, 
                  for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  Upon termination, your right to use the Service will cease immediately. If you wish to terminate your 
                  account, you may simply discontinue using the Service.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  All provisions of the Terms which by their nature should survive termination shall survive termination, 
                  including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations 
                  of liability.
                </p>
              </section>

              {/* Governing Law */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">10. Governing Law</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  These Terms shall be interpreted and governed by the laws of [Jurisdiction], without regard to its 
                  conflict of law provisions.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  Any disputes arising out of or relating to these Terms or the Service shall be resolved through 
                  binding arbitration in accordance with the rules of [Arbitration Organization].
                </p>
              </section>

              {/* Changes to Terms */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">11. Changes to Terms</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a 
                  revision is material, we will try to provide at least 30 days notice prior to any new terms taking 
                  effect.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed">
                  What constitutes a material change will be determined at our sole discretion. By continuing to access 
                  or use our Service after any revisions become effective, you agree to be bound by the revised terms.
                </p>
              </section>

              {/* Contact Information */}
              <section className="rounded-lg p-6 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">12. Contact Information</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
                  <p>• Email: legal@boing.finance</p>
                  <p>• Discord: <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">#legal-support</a></p>
                  <p>• Telegram: <a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">@boing_finance</a></p>
                </div>
              </section>
            </div>

            {/* Footer Note */}
            <div className="rounded-lg p-6 border text-center mt-8" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                These Terms of Service were last updated on January 2025. Please review them carefully before using 
                the boing.finance platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms; 