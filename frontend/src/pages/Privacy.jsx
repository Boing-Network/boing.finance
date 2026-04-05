import React from 'react';
import { Helmet } from 'react-helmet-async';

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | boing.finance</title>
        <meta name="description" content="Privacy Policy for boing.finance. How we collect, use, and protect your information." />
        <meta name="keywords" content="privacy policy, data protection, GDPR, privacy, boing.finance, DEX" />
        <meta property="og:title" content="Privacy Policy | boing.finance" />
        <meta property="og:description" content="Privacy Policy for boing.finance - How we collect, use, and protect your information." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/privacy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy - boing.finance" />
        <meta name="twitter:description" content="Privacy Policy for boing.finance - Data protection and privacy information." />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      
      <div className="relative w-full min-w-0" style={{ color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Privacy Policy
              </h1>
              <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
                boing.finance - Cross-Chain Decentralized Exchange
              </p>
              <div className="flex justify-center space-x-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <span>Last Updated: January 2025</span>
                <span>•</span>
                <span>Version 1.0</span>
                <span>•</span>
                <span>boing.finance LLC (Florida)</span>
              </div>
            </div>

            {/* Introduction */}
            <div className="rounded-lg p-6 mb-8 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                At boing.finance, we are committed to protecting your privacy and ensuring the security of your personal 
                information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our decentralized exchange platform and related services.
              </p>
            </div>

            {/* Privacy Sections */}
            <div className="space-y-8">
              {/* Information We Collect */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">1. Information We Collect</h2>
                
                <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">1.1 Information You Provide</h3>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We may collect information that you voluntarily provide when using our Service:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Wallet addresses when you connect to the platform</li>
                  <li>Transaction data and trading history</li>
                  <li>Communication preferences and settings</li>
                  <li>Feedback and support requests</li>
                  <li>Information provided through our contact forms</li>
                </ul>

                <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">1.2 Automatically Collected Information</h3>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  When you use our Service, we automatically collect certain information:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Operating system and platform</li>
                  <li>Usage patterns and analytics data</li>
                  <li>Error logs and performance metrics</li>
                </ul>

                <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">1.3 Blockchain Data</h3>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Since our Service operates on public blockchains, certain information is publicly available:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2">
                  <li>Transaction hashes and blockchain addresses</li>
                  <li>Trading volumes and liquidity pool data</li>
                  <li>Smart contract interactions</li>
                  <li>Cross-chain bridge transactions</li>
                </ul>
              </section>

              {/* How We Use Information */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">2. How We Use Information</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Providing and maintaining the Service</li>
                  <li>Processing transactions and managing liquidity pools</li>
                  <li>Improving user experience and platform functionality</li>
                  <li>Analyzing usage patterns and optimizing performance</li>
                  <li>Detecting and preventing fraud or abuse</li>
                  <li>Communicating with users about updates and features</li>
                  <li>Complying with legal obligations and regulations</li>
                </ul>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </section>

              {/* Information Sharing */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">3. Information Sharing and Disclosure</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We may share your information in the following circumstances:
                </p>
                
                <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">3.1 Service Providers</h3>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We may share information with trusted third-party service providers who assist us in operating our 
                  platform, such as:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Cloud hosting and infrastructure providers</li>
                  <li>Analytics and monitoring services</li>
                  <li>Customer support platforms</li>
                  <li>Security and fraud detection services</li>
                </ul>

                <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">3.2 Legal Requirements</h3>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We may disclose information if required by law or in response to:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Valid legal requests or court orders</li>
                  <li>Government investigations or regulatory inquiries</li>
                  <li>Protection of our rights, property, or safety</li>
                  <li>Prevention of fraud or illegal activities</li>
                </ul>

                <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">3.3 Business Transfers</h3>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred as 
                  part of the transaction, subject to the same privacy protections.
                </p>
              </section>

              {/* Data Security */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">4. Data Security</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your information:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure development practices and code reviews</li>
                  <li>Employee training on data protection</li>
                </ul>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm">
                    <strong>Important:</strong> While we implement security measures, no method of transmission over 
                    the internet or electronic storage is 100% secure. We cannot guarantee absolute security of your 
                    information.
                  </p>
                </div>
              </section>

              {/* Data Retention */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">5. Data Retention</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We retain your information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Provide and maintain the Service</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Improve our platform and services</li>
                </ul>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  When we no longer need your information, we will securely delete or anonymize it in accordance 
                  with applicable laws and regulations.
                </p>
              </section>

              {/* Your Rights */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">6. Your Rights and Choices</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} rounded-lg p-4">
                    <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-2">Access and Portability</h4>
                    <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                      Request access to your personal information and receive a copy in a portable format.
                    </p>
                  </div>
                  
                  <div className="style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} rounded-lg p-4">
                    <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-2">Correction</h4>
                    <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                      Request correction of inaccurate or incomplete personal information.
                    </p>
                  </div>
                  
                  <div className="style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} rounded-lg p-4">
                    <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-2">Deletion</h4>
                    <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                      Request deletion of your personal information, subject to legal requirements.
                    </p>
                  </div>
                  
                  <div className="style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} rounded-lg p-4">
                    <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-2">Objection</h4>
                    <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                      Object to processing of your personal information in certain circumstances.
                    </p>
                  </div>
                </div>
                
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mt-4">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </section>

              {/* Cookies and Tracking */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">7. Cookies and Tracking Technologies</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to enhance your experience:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Essential cookies for platform functionality</li>
                  <li>Analytics cookies to understand usage patterns</li>
                  <li>Preference cookies to remember your settings</li>
                  <li>Security cookies to protect against fraud</li>
                </ul>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  You can control cookie settings through your browser preferences. However, disabling certain cookies 
                  may affect the functionality of our Service.
                </p>
              </section>

              {/* Third-Party Services */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">8. Third-Party Services</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  Our Service may contain links to third-party websites or integrate with third-party services. 
                  We are not responsible for the privacy practices of these third parties.
                </p>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  When you interact with third-party services through our platform:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2">
                  <li>Their privacy policies govern the collection and use of your information</li>
                  <li>We recommend reviewing their privacy practices</li>
                  <li>We do not control or endorse their privacy practices</li>
                </ul>
              </section>

              {/* International Transfers */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">9. International Data Transfers</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  Your information may be transferred to and processed in countries other than your own. We ensure 
                  appropriate safeguards are in place to protect your information during international transfers.
                </p>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  For users in the European Economic Area (EEA), we rely on adequacy decisions, standard contractual 
                  clauses, or other appropriate safeguards for international data transfers.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">10. Children's Privacy</h2>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Our Service is not intended for children under the age of 18. We do not knowingly collect personal 
                  information from children under 18. If you believe we have collected information from a child under 
                  18, please contact us immediately.
                </p>
              </section>

              {/* Changes to Privacy Policy */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">11. Changes to This Privacy Policy</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or applicable 
                  laws. We will notify you of any material changes by:
                </p>
                <ul className="list-disc list-inside style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                  <li>Posting the updated policy on our website</li>
                  <li>Sending email notifications to registered users</li>
                  <li>Displaying prominent notices on our platform</li>
                </ul>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Your continued use of the Service after any changes constitutes acceptance of the updated Privacy Policy.
                </p>
              </section>

              {/* Contact Information */}
              <section className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">12. Contact Us</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
                  <p>• Email: privacy@boing.finance</p>
                  <p>• Discord: <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">#privacy-support</a></p>
                  <p>• Telegram: <a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">@boing_finance</a></p>
                </div>
                <p className="style={{ color: 'var(--text-secondary)' }} leading-relaxed mt-4">
                  For users in the European Union, you also have the right to lodge a complaint with your local 
                  data protection authority.
                </p>
              </section>
            </div>

            {/* Footer Note */}
            <div className="rounded-lg p-6 border text-center mt-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                This Privacy Policy was last updated on January 2025. We are committed to protecting your privacy 
                and will continue to review and improve our privacy practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy; 