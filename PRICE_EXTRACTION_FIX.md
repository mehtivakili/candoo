# Price Extraction Fix

## Problem

The menu was showing:
- ✅ Product names
- ✅ Descriptions  
- ✅ Categories
- ✅ Discounts (for some items)
- ❌ **Prices were missing!**

## Root Cause

The price selectors were **too specific** and only worked with exact class names. When SnappFood's HTML structure changed slightly, the selectors failed to find prices.

## Solution

Implemented a **multi-strategy price extraction** with fallbacks:

### Strategy 1: Multiple Selector Approach

Instead of one specific selector, try multiple selectors in order:

#### For Final Price:
```typescript
const finalPriceSelectors = [
  'span.sc-hKgILt.hxREoh',          // Original specific selector
  '.sc-dlfnbm.hmnfCP span',         // Container-based selector
  'span[class*="price"]',            // Generic price class
  'span[class*="Price"]',            // Capitalized version
  '.price span',                     // Simple class selector
  'strong[class*="sc-"]'             // Strong tags with sc- classes
];

// Try each selector until one works
for (const selector of finalPriceSelectors) {
  const priceElement = footerElement.querySelector(selector);
  if (priceElement) {
    finalPrice = extractPrice(priceElement.textContent);
    if (finalPrice) break;  // Success! Stop searching
  }
}
```

#### For Original Price:
```typescript
const originalPriceSelectors = [
  's.sc-hKgILt.fYlAbO',     // Original specific selector
  's[class*="sc-"]',         // Any strikethrough with sc- class
  's',                       // Any strikethrough element
  '.original-price',         // Common original price class
  '[class*="original"]'      // Any element with "original" in class
];
```

#### For Discount:
```typescript
const discountSelectors = [
  '.sc-lmoMRL.cVMWeE',           // Original specific selector
  '[class*="Discount"]',          // Any discount class
  'span[class*="discount"]'       // Span with discount in class
];
```

### Strategy 2: Text Pattern Matching

If selectors fail, **search the entire card text** for price patterns:

```typescript
// Look for Persian price patterns: "123,456 تومان" or "123456 تومان"
const pricePatterns = [
  /(\d{1,3}(?:[,،]\d{3})*)\s*تومان/g,  // With thousands separator
  /(\d+)\s*تومان/g                      // Without separator
];

for (const pattern of pricePatterns) {
  const matches = [...cardText.matchAll(pattern)];
  if (matches.length > 0) {
    finalPrice = extractPrice(matches[0][1]);
    
    // If multiple prices found, first is original, second is final
    if (matches.length > 1) {
      originalPrice = extractPrice(matches[0][1]);
      finalPrice = extractPrice(matches[1][1]);
    }
    break;
  }
}
```

## Key Improvements

### 1. Fallback Chain
✅ Try specific selectors first (fastest)
✅ Try generic selectors if specific fail
✅ Try text pattern matching as last resort
✅ Always finds prices if they exist in the HTML

### 2. Pattern Matching
✅ Handles Persian comma (،)
✅ Handles English comma (,)
✅ Handles prices with/without separators
✅ Finds multiple prices (original + discounted)

### 3. Debug Logging
✅ Logs first 3 items for debugging
✅ Shows what was extracted
✅ Helps identify selector issues

## How It Works

### Example 1: Normal Product
```html
<div class="ProductCard__Footer-sc-1wfx2e0-1">
  <span class="sc-hKgILt hxREoh">125,000 تومان</span>
</div>
```

**Result:** 
- Final Price: 125000 ✅
- Extracted by: First selector match

### Example 2: Discounted Product
```html
<div class="ProductCard__Footer-sc-1wfx2e0-1">
  <s>150,000 تومان</s>
  <span>127,500 تومان</span>
  <span class="discount">15%</span>
</div>
```

**Result:**
- Original Price: 150000 ✅
- Final Price: 127500 ✅
- Discount: 15% ✅

### Example 3: Changed Selectors (Fallback)
```html
<div class="NewFooterClass">
  125,000 تومان
</div>
```

**Result:**
- Final Price: 125000 ✅
- Extracted by: Text pattern matching (fallback)

## Debug Output

When you load a menu, check the browser console for:

```
Item 1: کمبو استریت
  - Description: پیتزا استریت با نوشابه
  - Final Price: 736250
  - Original Price: 775000
  - Discount: 5%
  - Image: Yes

Item 2: پیتزا مخصوص
  - Description: ...
  - Final Price: 450000
  - Original Price: null
  - Discount: null%
  - Image: Yes
```

This helps you see:
- What's being extracted
- Which fields are missing
- If selectors are working

## Testing

### 1. Restart Dev Server
```bash
npm run dev
```

### 2. Load a Menu
1. Search for vendors
2. Add to saved list
3. Click "مشاهده منو"

### 3. Check Console (F12)
Look for debug output showing extracted prices

### 4. Check UI
- Prices should now display in tables
- Original prices show with strikethrough
- Discounts show in red badges

## Expected Results

### Success Indicators:
✅ All products show final prices
✅ Discounted products show original price (strikethrough)
✅ Discount percentages display in red
✅ Console logs show extracted prices
✅ No "null" or "-" in price columns

### If Prices Still Missing:

1. **Check Console Logs**
   - Do debug logs show prices?
   - If yes: Frontend display issue
   - If no: Extraction issue

2. **Check Card Text**
   - Open browser on SnappFood
   - Inspect product card
   - Look for price text
   - Check if "تومان" is present

3. **Test Pattern**
   - Open console on SnappFood page
   - Run: `document.body.textContent.match(/(\d+)\s*تومان/g)`
   - Should show all prices on page

4. **Share Debug Output**
   - Copy console logs
   - Copy "نمایش داده خام" output
   - Share for further debugging

## Code Changes

### File: `lib/sophisticated-automation.ts`

**Changed:**
- Price extraction logic (lines 419-505)
- Added multiple selector strategies
- Added text pattern matching fallback
- Added debug logging (lines 511-519)

**What's New:**
- 6 selectors for final price (vs 1 before)
- 5 selectors for original price (vs 1 before)
- 3 selectors for discount (vs 1 before)
- 2 regex patterns for text matching
- Debug logs for first 3 items

## Maintenance

### If Prices Still Don't Extract:

1. **Add New Selector**
   ```typescript
   const finalPriceSelectors = [
     // ... existing selectors
     'your-new-selector-here',  // Add new selector
   ];
   ```

2. **Update Pattern**
   ```typescript
   const pricePatterns = [
     // ... existing patterns
     /your-new-pattern/g,  // Add new pattern
   ];
   ```

3. **Increase Debug Logs**
   ```typescript
   if (items.length < 10) {  // Change from 3 to 10
     console.log(...);
   }
   ```

## Summary

Fixed missing prices by:
✅ Adding 6 different price selectors (vs 1)
✅ Implementing fallback pattern matching
✅ Handling multiple price formats
✅ Adding debug logging
✅ Making extraction more robust

**Prices should now extract reliably!** 🎉

## Next Steps

1. Restart dev server
2. Load a menu
3. Check console for debug output
4. Verify prices display in UI
5. Share results if issues persist

