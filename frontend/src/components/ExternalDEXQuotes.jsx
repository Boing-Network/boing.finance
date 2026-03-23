import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import externalSwapService from '../services/externalSwapService';

const ExternalDEXQuotes = ({ 
  tokenIn, 
  tokenOut, 
  amountIn, 
  chainId, 
  onQuoteSelect, 
  isVisible = false 
}) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);

  useEffect(() => {
    if (isVisible && tokenIn && tokenOut && amountIn && chainId) {
      fetchQuotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, tokenIn, tokenOut, amountIn, chainId]);

  const fetchQuotes = async () => {
    if (!externalSwapService.isExternalDEXsAvailable(chainId)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert amount to wei
      const amountInWei = ethers.parseUnits(amountIn, 18); // Assuming 18 decimals for now
      
      const externalQuotes = await externalSwapService.getSwapQuotes(
        tokenIn,
        tokenOut,
        amountInWei,
        chainId
      );

      setQuotes(externalQuotes);
      
      // Auto-select the best quote
      if (externalQuotes.length > 0) {
        setSelectedQuote(externalQuotes[0]);
        onQuoteSelect(externalQuotes[0]);
      }
    } catch (error) {
      console.error('Error fetching external quotes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSelect = (quote) => {
    setSelectedQuote(quote);
    onQuoteSelect(quote);
  };

  const getDEXIcon = (dexName) => {
    const icons = {
      'Uniswap V2': '🦄',
      'SushiSwap': '🍣',
      'Your DEX': '🚀'
    };
    return icons[dexName] || '📊';
  };

  const getDEXColor = (dexName) => {
    const colors = {
      'Uniswap V2': 'bg-purple-600',
      'SushiSwap': 'bg-pink-600',
      'Your DEX': 'bg-blue-600'
    };
    return colors[dexName] || 'bg-gray-600';
  };

  if (!isVisible) {
    return null;
  }

  if (!externalSwapService.isExternalDEXsAvailable(chainId)) {
    return (
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <p className="text-gray-400 text-sm">
          External DEX integration not available for this network
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-300">Scanning external DEXs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <p className="text-red-400 text-sm">
          Error scanning external DEXs: {error}
        </p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <p className="text-gray-400 text-sm">
          No external DEX quotes available for this pair
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">External DEX Quotes</h3>
          <span className="px-2 py-0.5 bg-green-600/80 text-white text-xs font-medium rounded-full" title="Best route by output amount">
            Best Route
          </span>
        </div>
        <span className="text-sm text-gray-400">
          {quotes.length} quote{quotes.length !== 1 ? 's' : ''} found
        </span>
      </div>
      
      <div className="space-y-2">
        {quotes.map((quote, index) => (
          <div
            key={`${quote.dex}-${index}`}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedQuote === quote
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
            }`}
            onClick={() => handleQuoteSelect(quote)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full ${getDEXColor(quote.dexName)} flex items-center justify-center text-white font-bold`}>
                  {getDEXIcon(quote.dexName)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{quote.dexName}</span>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                        Best Rate
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Fee: {(quote.fee * 100).toFixed(2)}% • Impact: {quote.priceImpact.toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-white">
                  {parseFloat(quote.amountOut).toFixed(6)} {quote.tokenOutSymbol}
                </div>
                <div className="text-sm text-gray-400">
                  Rate: 1 {quote.tokenInSymbol} = {(parseFloat(quote.amountOut) / parseFloat(quote.amountIn)).toFixed(6)} {quote.tokenOutSymbol}
                </div>
              </div>
            </div>
            
            {selectedQuote === quote && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Estimated Gas:</span>
                  <span className="text-white">{quote.gasEstimate.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Pair Address:</span>
                  <span className="text-blue-400 font-mono text-xs">
                    {quote.pairAddress.slice(0, 6)}...{quote.pairAddress.slice(-4)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedQuote && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-blue-400 font-semibold">Selected: {selectedQuote.dexName}</span>
              <div className="text-sm text-gray-300">
                You'll receive {parseFloat(selectedQuote.amountOut).toFixed(6)} {selectedQuote.tokenOutSymbol}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Price Impact</div>
              <div className={`font-semibold ${
                selectedQuote.priceImpact < 1 ? 'text-green-400' :
                selectedQuote.priceImpact < 5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {selectedQuote.priceImpact.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalDEXQuotes; 