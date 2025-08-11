# RevenueCat Setup Guide

## Overview
This app uses a two-tier authentication system:
1. **User Authentication**: Email/password login to your API gateway service (gets a token)
2. **Subscription Validation**: RevenueCat checks if the authenticated user has an active subscription

The paywall will load when the MainChatScreen loads if the user is authenticated but doesn't have an active subscription.

## Configuration Steps

### 1. Get Your RevenueCat API Keys
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Create a new project or select an existing one
3. Go to Project Settings > API Keys
4. Copy your API keys:
   - **Android API Key**: Starts with `goog_`
   - **iOS API Key**: Starts with `appl_`

### 2. Update Configuration
Edit `config/revenuecat.ts` and replace the placeholder API keys:

```typescript
export const REVENUECAT_CONFIG = {
  // Replace these with your actual RevenueCat API keys
  API_KEY_ANDROID: 'goog_nhSwdzRuGPJeDpXyKKBOTULqYJS',
  API_KEY_IOS: 'appl_YourActualIOSAPIKeyHere',
  
  // Entitlement identifier (should match your RevenueCat dashboard)
  ENTITLEMENT_ID: 'Active',
  
  // Offering identifier (optional)
  OFFERING_ID: 'default_version1',
};
```

### 3. Configure RevenueCat Dashboard
1. **Create an Entitlement**:
   - Go to Project Settings > Entitlements
   - Create an entitlement with identifier `pro` (or change the code to match your identifier)

2. **Create an Offering**:
   - Go to Monetization > Offerings
   - Create an offering (e.g., "default")
   - Add products to the offering

3. **Configure Products**:
   - Go to Monetization > Products
   - Add your subscription products
   - Link them to your offering

### 4. Testing
- Users must first authenticate with email/password to your API
- The paywall will appear when the MainChatScreen loads if the user is authenticated but doesn't have an active subscription
- Users can purchase a subscription through the paywall
- After purchase, they can use the app normally
- The RevenueCat user ID is automatically set to match your user's ID from the API

## Troubleshooting

### Paywall Not Appearing
1. Check that RevenueCat is properly initialized in `App.tsx`
2. Verify your API keys are correct
3. Check the console logs for any errors
4. Ensure your entitlement identifier matches between code and dashboard

### App Crashes
1. The app now has better error handling to prevent crashes
2. Check that all RevenueCat functions are wrapped in try-catch blocks
3. Verify your RevenueCat configuration is correct

### Logs Not Appearing
- Since you're running from Windows but the project is in Wsl, you may need to check logs in the Android Studio console
- Try adding more console.log statements to debug issues
- Consider using a logging service like Crashlytics for better debugging

## Changes Made

1. **Two-Tier Authentication**: Implemented proper separation between user authentication and subscription validation
2. **RevenueCat User ID Sync**: Automatically syncs RevenueCat user ID with your API user ID
3. **RevenueCat Initialization**: Added proper initialization in `App.tsx`
4. **Paywall Timing**: Moved paywall presentation from submit to screen load
5. **Error Handling**: Added comprehensive error handling to prevent crashes
6. **Configuration**: Created a centralized configuration file
7. **Better UX**: Users now see the paywall immediately if they need to subscribe 