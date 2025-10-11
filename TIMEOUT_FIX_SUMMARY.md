# Navigation Timeout Fix

## Problem Identified

The real issue was **NOT a UI crash** - it was a **backend navigation timeout**:

```
❌ Error [TimeoutError]: Navigation timeout of 30000 ms exceeded
```

The browser was timing out when trying to load the SnappFood vendor menu page.

## Root Causes

1. **Too strict wait condition**: `waitUntil: 'networkidle2'` waits for no network activity for 500ms, which is too strict for dynamic sites
2. **Short timeout**: 30 seconds wasn't enough for slow pages
3. **No fallback handling**: If navigation failed, the entire extraction failed
4. **Single selector dependency**: Only checking one specific selector

## Fixes Applied

### 1. Relaxed Navigation Conditions

**Before:**
```typescript
await this.page?.goto(vendorUrl, {
  waitUntil: 'networkidle2',  // Too strict!
  timeout: 30000               // Too short!
});
```

**After:**
```typescript
await this.page?.goto(vendorUrl, {
  waitUntil: 'domcontentloaded',  // Less strict - just wait for DOM
  timeout: 60000                   // Doubled timeout to 60 seconds
});
```

### 2. Added Error Recovery

Navigation errors are now caught but don't stop extraction:
```typescript
try {
  await this.page?.goto(vendorUrl, { ... });
  console.log('✅ Page navigation completed');
} catch (navError) {
  console.error('⚠️ Navigation error, but will try to extract anyway:', navError);
  // Don't throw - page might have partially loaded
}
```

### 3. Alternative Selector Fallbacks

If main selector not found, tries alternatives:
```typescript
const alternativeSelectors = [
  'h1',                              // Any h1
  'section[data-categoryid]',        // Category sections
  '.ProductCard__Box-sc-1wfx2e0-0'   // Product cards
];
```

### 4. Better Error Messages

**Backend (API):**
- Detects timeout errors
- Provides user-friendly messages
- Returns 200 status so frontend can display error properly

**Frontend (UI):**
- Shows Persian error message
- Suggests troubleshooting steps
- Doesn't crash the page

## What Changed

### `lib/sophisticated-automation.ts`

✅ Changed `waitUntil` from `'networkidle2'` to `'domcontentloaded'`
✅ Increased timeout from 30s to 60s
✅ Added try-catch around navigation
✅ Added alternative selector checking
✅ Added 3-second delay after navigation for dynamic content
✅ Better console logging throughout

### `app/api/vendor-menu/route.ts`

✅ Better error message formatting
✅ Specific handling for timeout errors
✅ Returns 200 status for proper frontend error handling
✅ Includes error type in response

### `components/SnappFoodSearch.tsx`

✅ Shows user-friendly alert for timeouts
✅ Persian error messages
✅ Troubleshooting suggestions

## Testing Instructions

### 1. Restart Development Server
```bash
# Press Ctrl+C to stop
npm run dev
```

### 2. Test Menu Loading

1. Search for vendors (e.g., "پیتزا")
2. Add a vendor to saved list
3. Click "مشاهده منو" (View Menu)
4. **Be patient** - it might take up to 60 seconds

### 3. Watch Console Output

You should see:
```
🔍 Extracting vendor menu from: ...
🌐 Navigating to vendor page...
✅ Page navigation completed
⏳ Waiting for main content to load...
✅ Main content loaded
📊 Starting data extraction...
✅ Extraction completed successfully
```

### 4. If Timeout Still Occurs

You'll see:
```
⚠️ Navigation error, but will try to extract anyway: TimeoutError...
⏳ Waiting for main content to load...
✅ Found alternative selector: h1
📊 Starting data extraction...
```

## Common Scenarios

### Scenario 1: Slow Internet
**Before:** Failed immediately after 30s
**After:** Waits up to 60s, shows helpful error message

### Scenario 2: Page Loads Slowly
**Before:** Waited for all network requests to finish
**After:** Proceeds as soon as DOM is ready

### Scenario 3: Some Elements Don't Load
**Before:** Failed if main selector not found
**After:** Tries alternative selectors, proceeds anyway

### Scenario 4: Complete Navigation Failure
**Before:** Extraction stopped completely
**After:** Still tries to extract from partially loaded page

## Success Indicators

✅ Navigation completes within 60 seconds
✅ At least one selector is found (main or alternative)
✅ Data extraction succeeds
✅ Menu displays in UI
✅ No UI crash or reset

## If Still Timing Out

### Option 1: Check Internet Connection
```bash
# Test if you can reach SnappFood
ping snappfood.ir
```

### Option 2: Try Different Vendor
Some restaurant pages might load faster than others

### Option 3: Clear Browser Profile
The `snapp-profile` folder might have cached data causing issues:
```bash
# Close the app first, then:
rm -rf snapp-profile
# Or on Windows:
rmdir /s snapp-profile
```

### Option 4: Check SnappFood Status
SnappFood might be blocking automated browsers or experiencing issues

### Option 5: Increase Timeout Further
Edit `lib/sophisticated-automation.ts` line 248:
```typescript
timeout: 90000  // 90 seconds
```

## Error Messages

### "Navigation timeout of 60000 ms exceeded"
**Meaning:** Page didn't load within 60 seconds
**Solution:** 
- Check internet connection
- Try different vendor
- Increase timeout

### "Page took too long to load..."
**Meaning:** Same as above, user-friendly version
**Solution:** Click OK and try again

### "Page not available"
**Meaning:** Browser page was closed or crashed
**Solution:** Refresh the page and try again

## Monitoring

Watch the terminal/console for these patterns:

**Good:**
```
✅ Page navigation completed
✅ Main content loaded
✅ Extraction completed successfully
```

**Warning (but OK):**
```
⚠️ Navigation error, but will try to extract anyway
⚠️ Main selector not found, trying alternative selectors
✅ Found alternative selector: h1
```

**Bad:**
```
❌ Error extracting vendor menu
❌ Navigation timeout
❌ No selectors found
```

## Performance Notes

- **First load**: Might take 30-60 seconds (browser initialization + page load)
- **Subsequent loads**: Should be faster (browser already running)
- **Different vendors**: Load times vary based on menu size

## Files Modified

1. `lib/sophisticated-automation.ts` - Relaxed navigation, added fallbacks
2. `app/api/vendor-menu/route.ts` - Better error handling
3. `components/SnappFoodSearch.tsx` - User-friendly error messages

## Summary

The timeout issue has been addressed by:
✅ Relaxing navigation conditions
✅ Increasing timeout duration
✅ Adding error recovery
✅ Implementing selector fallbacks
✅ Providing helpful error messages
✅ Not crashing the UI on errors

**Try it now!** The menu loading should be much more reliable. 🚀

