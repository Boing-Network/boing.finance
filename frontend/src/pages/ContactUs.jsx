import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const subject = encodeURIComponent(
        `[${formData.category}] ${formData.subject || 'Contact from boing.finance'}`
      );
      const body = encodeURIComponent(
        [
          `Name: ${formData.name}`,
          `Email: ${formData.email}`,
          `Category: ${formData.category}`,
          '',
          formData.message,
        ].join('\n')
      );
      const to =
        formData.category === 'security'
          ? 'security@boing.finance'
          : formData.category === 'business'
            ? 'business@boing.finance'
            : 'support@boing.finance';

      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus(null), 8000);
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCategories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'business', label: 'Business Partnership' },
    { value: 'security', label: 'Security Issue' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' }
  ];

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'For detailed inquiries and support requests',
      contact: 'support@boing.finance',
      link: 'mailto:support@boing.finance',
      response: 'Within 48 hours'
    },
    {
      icon: '🔒',
      title: 'Security Issues',
      description: 'For security vulnerabilities and urgent matters',
      contact: 'security@boing.finance',
      link: 'mailto:security@boing.finance',
      response: 'Within 24 hours'
    },
    {
      icon: '💼',
      title: 'Business Inquiries',
      description: 'For partnerships and investment opportunities',
      contact: 'business@boing.finance',
      link: 'mailto:business@boing.finance',
      response: 'Within 72 hours'
    }
  ];

  const supportChannels = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Primary support channel for all inquiries',
      link: 'mailto:support@boing.finance',
      status: 'Available'
    },
    {
      icon: '🐛',
      title: 'Bug Reports',
      description: 'Report bugs and technical issues',
      link: '/bug-report',
      status: 'Available'
    },
    {
      icon: '💼',
      title: 'Business Contact',
      description: 'For partnerships and investment inquiries',
      link: 'mailto:business@boing.finance',
      status: 'Available'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us | boing.finance — Support & Community</title>
        <meta name="description" content="Get in touch with boing.finance. Support, community links, and how to report issues." />
        <meta name="keywords" content="contact, support, help, boing.finance, DEX, customer service" />
        <meta property="og:title" content="Contact Us | boing.finance" />
        <meta property="og:description" content="Get in touch with boing.finance - Contact our support team and join our community." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/contact" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Us - boing.finance" />
        <meta name="twitter:description" content="Get in touch with boing.finance - Support and community." />
      </Helmet>
      
      <div className="relative w-full min-w-0" style={{ color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Contact Us
              </h1>
              <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
                Get in touch with our team. We're here to help!
              </p>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> boing.finance is a solo-founder project. While we provide direct support, response times may vary as we're currently seeking funding for team expansion.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Send us a Message</h2>
                
                {submitStatus === 'success' && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400">✅</span>
                      <p className="text-green-200">Your email client should open with this message. Send it to reach our team — nothing is submitted until you hit send.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      autoComplete="off"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {contactCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      autoComplete="off"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="Brief subject of your inquiry"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      autoComplete="off"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center" style={{ color: 'var(--text-primary)' }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                {/* Direct Contact Methods */}
                <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Direct Contact</h2>
                  <div className="space-y-4">
                    {contactMethods.map((method) => (
                      <div key={method.title} className="flex items-start space-x-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{method.title}</h3>
                          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{method.description}</p>
                          <a
                            href={method.link}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            {method.contact}
                          </a>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Response time: {method.response}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support Channels */}
                <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Support Channels</h2>
                  <div className="space-y-4">
                    {supportChannels.map((channel) => (
                      <a
                        key={channel.title}
                        href={channel.link}
                        className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-600 transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                      >
                        <span className="text-2xl">{channel.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{channel.title}</h3>
                          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{channel.description}</p>
                          <p className="text-green-400 text-sm">{channel.status}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Support Information */}
                <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Support Information</h2>
                  <div className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span>24-48 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Issues:</span>
                      <span>Within 24 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Business Inquiries:</span>
                      <span>Within 72 hours</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <strong>Note:</strong> As a solo-founder project, response times may vary. We're actively seeking funding to expand our support team.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-12 rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Frequently Asked Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>How quickly do you respond?</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      We typically respond to general inquiries within 24 hours. Security issues are addressed within 4 hours.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Can I get technical support?</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Yes! Our technical support team is available to help with any platform-related issues.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Do you offer business partnerships?</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Absolutely! We're always interested in strategic partnerships. Contact our business team.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>How can I report a security issue?</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      For security vulnerabilities, please email security@boing.finance immediately. We take security seriously.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs; 