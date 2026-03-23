// Blog/News Page
// Content management for blog posts and news

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import EnhancedAnimatedBackground from '../components/EnhancedAnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import OptimizedImage from '../components/OptimizedImage';

const Blog = () => {
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    // In a real implementation, this would fetch from an API or CMS
    // For now, we'll use sample data
    const samplePosts = [
      {
        id: 1,
        title: 'Welcome to Boing Finance',
        excerpt: 'We\'re excited to launch our platform for token deployment and trading.',
        content: 'Boing Finance is a DEX to deploy tokens and trade on EVM and Solana.',
        author: 'Boing Team',
        date: '2025-01-28',
        image: '/hero-image.png',
        category: 'Announcement'
      },
      {
        id: 2,
        title: 'New Security Features Added',
        excerpt: 'We\'ve added advanced security features to our token deployment system.',
        content: 'Our latest update includes enhanced security features including anti-bot protection, cooldown periods, and more...',
        author: 'Boing Team',
        date: '2025-01-27',
        image: null,
        category: 'Update'
      },
      {
        id: 3,
        title: 'Multi-Chain Support Coming Soon',
        excerpt: 'We\'re working on expanding support to more blockchain networks.',
        content: 'Stay tuned for updates on our multi-chain expansion plans...',
        author: 'Boing Team',
        date: '2025-01-26',
        image: null,
        category: 'Roadmap'
      }
    ];

    setTimeout(() => {
      setPosts(samplePosts);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <EnhancedAnimatedBackground />
        <div className="relative z-10 flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Helmet>
        <title>Blog & News | boing.finance — Updates & Announcements</title>
        <meta name="description" content="Latest news, updates, and announcements from boing.finance. The DeFi that always bounces back." />
      </Helmet>
      <EnhancedAnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Blog & News
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Stay updated with the latest news, updates, and announcements
          </p>
        </div>

        {selectedPost ? (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="mb-6 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              ← Back to Blog
            </button>

            <article className="rounded-lg border p-8" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              {selectedPost.image && (
                <OptimizedImage
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <div className="flex items-center space-x-4 mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  {selectedPost.category}
                </span>
                <span>{selectedPost.date}</span>
                <span>by {selectedPost.author}</span>
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {selectedPost.title}
              </h2>
              <div className="prose prose-invert max-w-none" style={{ color: 'var(--text-secondary)' }}>
                <p>{selectedPost.content}</p>
              </div>
            </article>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="rounded-lg border p-6 cursor-pointer transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)'
                }}
              >
                {post.image && (
                  <OptimizedImage
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="flex items-center space-x-3 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    {post.category}
                  </span>
                  <span>{post.date}</span>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {post.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {post.excerpt}
                </p>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  by {post.author}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;

