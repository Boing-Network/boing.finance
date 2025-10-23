# Base MiniApp Integration Guide

Based on the official Base documentation: [Create a Mini App](https://docs.base.org/mini-apps/quickstart/create-new-miniapp#minikit-quickstart)

## 🚀 Current Status

✅ **Manifest File**: Updated to follow Base documentation format  
✅ **Configuration**: Created `minikit.config.ts` following Base standards  
✅ **SDK Integration**: Updated to use correct `window.minikit` approach  
✅ **Animated Background**: Restored to DeployToken page  

## 📋 Next Steps for Base App Integration

### 1. **Deploy to Production Domain**
Your app is currently deployed at: `https://2bfe069f.boing-finance.pages.dev`

### 2. **Create Account Association Credentials**
1. Go to [Base Build Account Association Tool](https://base.dev/apps?addApp=true)
2. Enter your domain: `https://2bfe069f.boing-finance.pages.dev`
3. Click "Submit" and follow verification steps
4. Copy the generated `accountAssociation` object

### 3. **Update minikit.config.ts**
Replace the empty `accountAssociation` object with your credentials:

```typescript
export const minikitConfig = {
  accountAssociation: {
    "header": "your-generated-header",
    "payload": "your-generated-payload", 
    "signature": "your-generated-signature"
  },
  miniapp: {
    // ... rest of config
  }
}
```

### 4. **Deploy Updated Configuration**
```bash
npm run build
npx wrangler pages deploy build --project-name=boing-finance
```

### 5. **Preview Your App**
1. Go to [base.dev/preview](https://base.dev/preview)
2. Add your app URL: `https://2bfe069f.boing-finance.pages.dev`
3. Verify embeds and metadata
4. Test the "Account association" tab

### 6. **Publish to Base App**
Create a post in the Base app with your app's URL to make it discoverable.

## 🔧 Technical Implementation

### Base MiniApp SDK Integration
The app now correctly checks for `window.minikit` instead of trying to import a non-existent package:

```javascript
if (typeof window !== 'undefined' && window.minikit) {
  const { MiniApp } = window.minikit;
  // Initialize Base MiniApp
}
```

### Manifest Format
Updated to match Base documentation requirements:
- Uses `iconUrl` instead of `icon`
- Includes `splashImageUrl` and `splashBackgroundColor`
- Follows Base's field naming conventions
- Points to correct production URLs

### Configuration File
Created `minikit.config.ts` following Base's template structure with:
- Account association placeholder
- Proper field names and structure
- Production URLs
- Base-compliant metadata

## 🎯 Key Benefits

- **Correct Integration**: Follows official Base documentation
- **Production Ready**: Uses actual deployed URLs
- **Base Compliant**: Matches Base's expected format
- **Future Proof**: Ready for when Base MiniApp SDK is available

## 📞 Support

- **Base Documentation**: [docs.base.org](https://docs.base.org)
- **Base Build**: [base.dev/apps](https://base.dev/apps)
- **Preview Tool**: [base.dev/preview](https://base.dev/preview)

---

**Ready for Base App submission!** 🚀

Your Boing Finance app now follows the official Base MiniApp integration process and is ready for submission to the Base ecosystem.
