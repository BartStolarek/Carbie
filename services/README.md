# Services Documentation

## AccessService

The `AccessService` is a centralized service that handles all access control logic including authentication checks, admin verification, and RevenueCat subscription validation.

### Features

- **Centralized Access Control**: All authentication and subscription logic in one place
- **Automatic Paywall Handling**: Multiple fallback strategies for paywall presentation
- **Admin Bypass**: Admins automatically get access without subscription checks
- **Caching**: User data is cached for performance
- **Comprehensive Logging**: All operations are logged for debugging

### Basic Usage

```typescript
import { accessService } from '../services/AccessService';

// Simple access check
const result = await accessService.checkAccess();
if (result.hasAccess) {
  // User has access to premium features
} else {
  // User needs to purchase subscription
}

// Access check with automatic handling (recommended)
const result = await accessService.checkAccessWithHandling(navigation);
// This will automatically:
// - Redirect to login if not authenticated
// - Present paywall if no subscription
// - Handle purchase flow
```

### API Reference

#### `checkAccess(): Promise<AccessResult>`

Performs a complete access check including:
1. Authentication verification
2. User data retrieval
3. Admin status check
4. RevenueCat subscription validation

Returns an `AccessResult` object with:
- `hasAccess`: boolean - Whether user has access to premium features
- `isAuthenticated`: boolean - Whether user is authenticated
- `isAdmin`: boolean - Whether user is an admin
- `hasSubscription`: boolean - Whether user has active subscription
- `user`: User | null - Current user object
- `error`: string | undefined - Error message if any

#### `checkAccessWithHandling(navigation?: any): Promise<AccessResult>`

Enhanced version that automatically handles:
- Navigation to login screen if not authenticated
- Paywall presentation if no subscription
- Purchase flow management

#### `handlePaywallPresentation(): Promise<PaywallResult>`

Presents paywall with multiple fallback strategies:
1. `presentPaywallIfNeeded()` - RevenueCat's recommended method
2. `presentPaywall()` - Standard paywall
3. `presentMonthlySubscriptionPaywall()` - Specific offering paywall

#### `getCurrentUser(): User | null`

Returns the cached current user object.

#### `clearCache(): void`

Clears the cached user data.

### Integration Examples

#### In Screen Components

```typescript
// In MainChatScreen or other screens
useFocusEffect(
  React.useCallback(() => {
    const checkAccess = async () => {
      const result = await accessService.checkAccessWithHandling(navigation);
      setAccessResult(result);
    };
    checkAccess();
  }, [])
);
```

#### In API Calls

```typescript
// Before making API calls
const handleSubmit = async () => {
  const accessResult = await accessService.checkAccess();
  if (!accessResult.hasAccess) {
    const paywallResult = await accessService.handlePaywallPresentation();
    if (!paywallResult.purchased) {
      showAlert('Subscription Required', 'Please purchase a subscription.');
      return;
    }
  }
  
  // Proceed with API call
  // ...
};
```

#### In Navigation Guards

```typescript
// Before navigating to premium screens
const navigateToPremium = async () => {
  const result = await accessService.checkAccessWithHandling(navigation);
  if (result.hasAccess) {
    navigation.navigate('PremiumScreen');
  }
};
```

### Benefits

1. **Modularity**: All access logic is centralized and reusable
2. **Consistency**: Same access checks across the entire app
3. **Maintainability**: Easy to modify access logic in one place
4. **Debugging**: Comprehensive logging for troubleshooting
5. **Flexibility**: Can be used at different points in the app flow

### Migration from Old Code

The old access control logic in `MainChatScreen` has been replaced with:

```typescript
// Old way (removed)
const isAuthenticated = await authService.isAuthenticated();
const user = await authService.getCurrentUser();
const hasSubscription = await validateSubscription();
// ... lots of inline logic

// New way
const result = await accessService.checkAccessWithHandling(navigation);
```

This makes the code much cleaner and more maintainable.