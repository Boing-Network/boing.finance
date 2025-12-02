// Data Export Utilities
// Provides CSV and JSON export functionality

/**
 * Converts an array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Optional array of header names
 * @returns {string} CSV string
 */
export const exportToCSV = (data, headers = null) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = csvHeaders.join(',');
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or quote
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Downloads data as CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} headers - Optional array of header names
 */
export const downloadCSV = (data, filename = 'export', headers = null) => {
  const csv = exportToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Downloads data as JSON file
 * @param {any} data - Data to export (can be object or array)
 * @param {string} filename - Name of the file (without extension)
 * @param {boolean} pretty - Whether to format JSON with indentation
 */
export const downloadJSON = (data, filename = 'export', pretty = true) => {
  const json = pretty 
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);
  
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Exports portfolio data
 * @param {Array} portfolioData - Array of token holdings
 * @param {string} format - 'csv' or 'json'
 */
export const exportPortfolio = (portfolioData, format = 'csv') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `portfolio_${timestamp}`;
  
  if (format === 'json') {
    downloadJSON(portfolioData, filename, true);
  } else {
    // Flatten portfolio data for CSV
    const flattened = portfolioData.map(token => ({
      'Token Name': token.name || '',
      'Symbol': token.symbol || '',
      'Network': token.network || '',
      'Balance': token.balance || '0',
      'USD Value': token.usdValue || '0',
      'Price (USD)': token.price || '0',
      'Address': token.address || ''
    }));
    
    downloadCSV(flattened, filename);
  }
};

/**
 * Exports analytics data
 * @param {Object} analyticsData - Analytics data object
 * @param {string} format - 'csv' or 'json'
 */
export const exportAnalytics = (analyticsData, format = 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `analytics_${timestamp}`;
  
  if (format === 'json') {
    downloadJSON(analyticsData, filename, true);
  } else {
    // Convert analytics data to CSV format
    // This depends on the structure of analyticsData
    const csvData = [];
    
    if (analyticsData.trendingTokens) {
      analyticsData.trendingTokens.forEach(token => {
        csvData.push({
          'Rank': token.rank || '',
          'Name': token.name || '',
          'Symbol': token.symbol || '',
          'Price (USD)': token.price || '0',
          '24h Change (%)': token.change24h || '0',
          'Market Cap': token.marketCap || '0'
        });
      });
    }
    
    if (csvData.length > 0) {
      downloadCSV(csvData, filename);
    }
  }
};

/**
 * Exports token list
 * @param {Array} tokens - Array of token objects
 * @param {string} format - 'csv' or 'json'
 */
export const exportTokens = (tokens, format = 'csv') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `tokens_${timestamp}`;
  
  if (format === 'json') {
    downloadJSON(tokens, filename, true);
  } else {
    const flattened = tokens.map(token => ({
      'Name': token.name || '',
      'Symbol': token.symbol || '',
      'Address': token.address || '',
      'Network': token.network || '',
      'Total Supply': token.totalSupply || '0',
      'Decimals': token.decimals || '18',
      'Created': token.createdAt || ''
    }));
    
    downloadCSV(flattened, filename);
  }
};

/**
 * Exports transaction history
 * @param {Array} transactions - Array of transaction objects
 * @param {string} format - 'csv' or 'json'
 */
export const exportTransactions = (transactions, format = 'csv') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `transactions_${timestamp}`;
  
  if (format === 'json') {
    downloadJSON(transactions, filename, true);
  } else {
    const flattened = transactions.map(tx => ({
      'Hash': tx.hash || '',
      'From': tx.from || '',
      'To': tx.to || '',
      'Value': tx.value || '0',
      'Token': tx.tokenSymbol || '',
      'Network': tx.network || '',
      'Timestamp': tx.timestamp || '',
      'Status': tx.status || ''
    }));
    
    downloadCSV(flattened, filename);
  }
};

/**
 * Exports data as PDF (using browser print functionality)
 * @param {HTMLElement} element - HTML element to export
 * @param {string} filename - Name of the file (without extension)
 */
export const exportToPDF = (element, filename = 'export') => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window. Please allow popups.');
    return;
  }

  // Get the HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .header {
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${filename}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        ${element.innerHTML}
        <div class="footer">
          <p>Generated by boing.finance</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

/**
 * Exports portfolio as PDF report
 * @param {Object} portfolioData - Portfolio data object
 */
export const exportPortfolioPDF = (portfolioData) => {
  // Create a temporary div with formatted portfolio data
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = `
    <h2>Portfolio Report</h2>
    <p><strong>Total Value:</strong> $${portfolioData.totalValue || '0'}</p>
    <p><strong>Total Tokens:</strong> ${portfolioData.totalTokens || '0'}</p>
    <p><strong>Total Pools:</strong> ${portfolioData.totalPools || '0'}</p>
    <h3>Token Holdings</h3>
    <table>
      <thead>
        <tr>
          <th>Token</th>
          <th>Symbol</th>
          <th>Balance</th>
          <th>USD Value</th>
          <th>Network</th>
        </tr>
      </thead>
      <tbody>
        ${portfolioData.balances?.map(token => `
          <tr>
            <td>${token.name || ''}</td>
            <td>${token.symbol || ''}</td>
            <td>${token.balance || '0'}</td>
            <td>$${token.value || '0'}</td>
            <td>${token.network || ''}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">No tokens</td></tr>'}
      </tbody>
    </table>
  `;
  
  exportToPDF(tempDiv, `portfolio_report_${new Date().toISOString().split('T')[0]}`);
};

