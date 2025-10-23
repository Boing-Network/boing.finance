const express = require('express');
const router = express.Router();

// Farcaster webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 Farcaster webhook received:', {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body
    });

    // Handle different types of Farcaster events
    const { type, data } = req.body;

    switch (type) {
      case 'user_interaction':
        console.log('👤 User interaction:', data);
        // Handle user interaction (app opens, button clicks, etc.)
        break;
      
      case 'user_follow':
        console.log('➕ User followed:', data);
        // Handle new follower
        break;
      
      case 'user_unfollow':
        console.log('➖ User unfollowed:', data);
        // Handle user unfollow
        break;
      
      case 'app_install':
        console.log('📱 App installed:', data);
        // Handle app installation
        break;
      
      case 'app_uninstall':
        console.log('🗑️ App uninstalled:', data);
        // Handle app uninstallation
        break;
      
      case 'analytics':
        console.log('📊 Analytics data:', data);
        // Handle analytics data
        break;
      
      default:
        console.log('❓ Unknown webhook type:', type, data);
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Still respond with 200 to prevent Farcaster from retrying
    res.status(200).json({
      success: false,
      message: 'Webhook processed with errors',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint for the webhook
router.get('/webhook/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
    service: 'boing.finance'
  });
});

module.exports = router;
