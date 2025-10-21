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
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
      
      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 2000);
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
        <title>Contact Us - boing.finance</title>
        <meta name="description" content="Get in touch with boing.finance - Contact our support team, join our community, or report issues with our cross-chain decentralized exchange platform." />
        <meta name="keywords" content="contact, support, help, boing.finance, DEX, customer service" />
        <meta property="og:title" content="Contact Us - boing.finance" />
        <meta property="og:description" content="Get in touch with boing.finance - Contact our support team and join our community." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/contact" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Us - boing.finance" />
        <meta name="twitter:description" content="Get in touch with boing.finance - Support and community." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Contact Us
              </h1>
              <p className="text-xl text-gray-300 mb-6">
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
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
                
                {submitStatus === 'success' && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400">✅</span>
                      <p className="text-green-200">Thank you! Your message has been sent successfully. We'll get back to you soon.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {contactCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief subject of your inquiry"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
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
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Direct Contact</h2>
                  <div className="space-y-4">
                    {contactMethods.map((method) => (
                      <div key={method.title} className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg">
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{method.title}</h3>
                          <p className="text-gray-300 text-sm mb-2">{method.description}</p>
                          <a
                            href={method.link}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            {method.contact}
                          </a>
                          <p className="text-gray-400 text-xs mt-1">Response time: {method.response}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support Channels */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Support Channels</h2>
                  <div className="space-y-4">
                    {supportChannels.map((channel) => (
                      <a
                        key={channel.title}
                        href={channel.link}
                        className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <span className="text-2xl">{channel.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{channel.title}</h3>
                          <p className="text-gray-300 text-sm mb-2">{channel.description}</p>
                          <p className="text-green-400 text-sm">{channel.status}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Support Information */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-4">Support Information</h2>
                  <div className="space-y-2 text-gray-300">
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
            <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">How quickly do you respond?</h3>
                    <p className="text-gray-300 text-sm">
                      We typically respond to general inquiries within 24 hours. Security issues are addressed within 4 hours.
                    </p>
                  </div>
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Can I get technical support?</h3>
                    <p className="text-gray-300 text-sm">
                      Yes! Our technical support team is available to help with any platform-related issues.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Do you offer business partnerships?</h3>
                    <p className="text-gray-300 text-sm">
                      Absolutely! We're always interested in strategic partnerships. Contact our business team.
                    </p>
                  </div>
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">How can I report a security issue?</h3>
                    <p className="text-gray-300 text-sm">
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