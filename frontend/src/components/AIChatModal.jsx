// AI DeFi Assistant Chat Modal
// Natural language help for swaps, liquidity, bridging, and security

import React, { useState, useRef, useEffect } from 'react';
import config from '../config';
import toast from 'react-hot-toast';

const SUGGESTED_QUESTIONS = [
  "What's the best way to add liquidity to ETH/USDC?",
  "Explain price impact on my swap",
  "How do I bridge tokens to Polygon?",
  "Is this token safe? What should I check?",
  "How does slippage work?"
];

const AIChatModal = ({ isOpen, onClose, context }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      const apiBase = config.apiUrl || config.workerUrl || `${window.location.origin}/api`;
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context: context || undefined })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to get response');
      }

      if (data.success && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error(data.error || 'No reply received');
      }
    } catch (err) {
      toast.error(err.message || 'AI assistant unavailable');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't process that. ${err.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="AI DeFi Assistant"
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-cyan-500/30 max-h-[70vh] sm:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI DeFi Assistant</h2>
              <p className="text-xs text-gray-400">Ask about swaps, liquidity, bridging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Ask me anything about boing.finance:</p>
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-xl bg-gray-700 text-gray-400 text-sm flex items-center gap-2">
                <span className="animate-pulse">Thinking...</span>
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <label htmlFor="ai-chat-input" className="sr-only">Ask about DeFi</label>
            <input
              ref={inputRef}
              id="ai-chat-input"
              name="aiChatMessage"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about DeFi..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
