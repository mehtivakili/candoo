# Professional Selectors Update

## Overview
Updated the menu extraction to use professional, specific SnappFood selectors for more reliable and comprehensive data extraction.

## What Was Added

### New Restaurant Information Fields

#### 1. **Restaurant Logo**
- **Selector:** `.VendorLogo__Logo-sc-9mwh1-0 img`
- **Display:** 20x20 rounded circle with border and shadow
- **Fallback:** Hidden if image fails to load

#### 2. **Rating Count**
- **Selector:** `.RateCommentBadge__RateBox-sc-olkjn5-0 .sc-hKgILt.fYlAbO`
- **Display:** Shows in parentheses next to rating (e.g., "4.6 (250 نظر)")
- **Example:** "⭐ 4.6 (250)"

#### 3. **Discount Badge**
- **Selector:** `.DiscountBadge__DiscountBox-sc-1q3szf-0 .sc-hKgILt.ctKvuL`
- **Display:** Red badge with white text and emoji
- **Example:** "🏷️ 20%"

#### 4. **Delivery Information**
- **Type Selector:** `.VendorStateBadgestyled__VendorStateTitleAndDescriptionStyled-sc-lbld2-1 .sc-hKgILt.sFIZX`
- **Fee Selector:** `.VendorStateBadgestyled__VendorStateTitleAndDescriptionStyled-sc-lbld2-1 .sc-hKgILt.jsaCNc`
- **Display:** Shows delivery type and fee
- **Example:** "🚚 ارسال اکسپرس رایگان"

#### 5. **Restaurant Address**
- **Selector:** `.AddressCard__AddressString-sc-17zx3wl-1`
- **Display:** Shows full address with location emoji
- **Example:** "📍 تهران، ستارخان، ..."

## Complete Selector Set

```typescript
const RESTAURANT_SELECTORS = {
  // Main restaurant info
  name: 'h1.sc-hKgILt.kNFBOq',
  logo: '.VendorLogo__Logo-sc-9mwh1-0 img',
  
  // Rating section
  rating: {
    container: '.RateCommentBadge__RateBox-sc-olkjn5-0',
    value: '.RateCommentBadge__RateBox-sc-olkjn5-0 .sc-hKgILt.jsaCNc',
    count: '.RateCommentBadge__RateBox-sc-olkjn5-0 .sc-hKgILt.fYlAbO',
    star: '.RateCommentBadge__RateBox-sc-olkjn5-0 svg'
  },
  
  // Discount badge
  discountBadge: {
    container: '.DiscountBadge__DiscountBox-sc-1q3szf-0',
    value: '.DiscountBadge__DiscountBox-sc-1q3szf-0 .sc-hKgILt.ctKvuL'
  },
  
  // Delivery information
  delivery: {
    container: '.VendorStateBadgestyled__VendorStateBadgeStyled-sc-lbld2-0',
    type: '.VendorStateBadgestyled__VendorStateTitleAndDescriptionStyled-sc-lbld2-1 .sc-hKgILt.sFIZX',
    fee: '.VendorStateBadgestyled__VendorStateTitleAndDescriptionStyled-sc-lbld2-1 .sc-hKgILt.jsaCNc'
  },
  
  // Address
  address: {
    container: '.AddressCard__Layout-sc-17zx3wl-0',
    text: '.AddressCard__AddressString-sc-17zx3wl-1'
  }
};
```

## Updated Data Structure

### Backend Interface (`lib/sophisticated-automation.ts`)

```typescript
interface VendorMenuData {
  restaurant: {
    name: string;
    rating: string;
    ratingCount?: string;        // NEW
    url: string;
    logo?: string | null;        // NEW
    discount?: string;           // NEW
    delivery?: {                 // NEW
      type: string;
      fee: string;
    };
    address?: string;            // NEW
  };
  categories: CategoryData[];
  totalItems: number;
  scrapedAt: string;
}
```

### Frontend Interface (`components/SnappFoodSearch.tsx`)

Matches backend interface exactly for type safety.

## New UI Display

### Restaurant Header Card

The menu now displays a beautiful header with:

```
┌─────────────────────────────────────────────────────┐
│  [LOGO]  🍕 Restaurant Name                         │
│                                                      │
│           ⭐ 4.6 (250 نظر)                          │
│           🚚 ارسال اکسپرس  رایگان                  │
│           🏷️ 20%                                    │
│           📍 Address...                              │
│                                       90 محصول      │
│                                  [نمایش داده خام]    │
└─────────────────────────────────────────────────────┘
```

### Features:

1. **Gradient Background** - Blue to purple gradient
2. **Logo Display** - Rounded circle with border
3. **Clear Typography** - Bold names, proper spacing
4. **Visual Icons** - Emojis for quick recognition
5. **Responsive Layout** - Flexbox for proper alignment
6. **Conditional Rendering** - Only shows fields that exist

## Extraction Process

### Step 1: Define Selectors
All selectors are defined in a structured object for easy maintenance.

### Step 2: Extract Data
```typescript
const restaurantName = cleanText(document.querySelector(SELECTORS.name)?.textContent);
const rating = cleanText(document.querySelector(SELECTORS.rating.value)?.textContent);
const ratingCount = cleanText(document.querySelector(SELECTORS.rating.count)?.textContent);
// ... etc
```

### Step 3: Structure Response
All extracted data is organized into a clean, typed structure.

### Step 4: Return Data
Single return statement with all restaurant information.

## Benefits

### 1. More Reliable Extraction
✅ Uses specific SnappFood selectors
✅ Less likely to break with minor site changes
✅ More maintainable code

### 2. Richer Data
✅ Logo extraction
✅ Rating count
✅ Discount information
✅ Delivery details
✅ Full address

### 3. Better UX
✅ Professional header display
✅ All info at a glance
✅ Visual hierarchy
✅ Clean design

### 4. Type Safety
✅ Fully typed interfaces
✅ Optional fields properly marked
✅ Frontend/backend alignment

## Example Output

### Console Log
```json
{
  "restaurant": {
    "name": "پیتزا شیلا (ستارخان)",
    "rating": "4.6",
    "ratingCount": "250 نظر",
    "url": "https://snappfood.ir/...",
    "logo": "https://cdn.snappfood.ir/...",
    "discount": "20%",
    "delivery": {
      "type": "ارسال اکسپرس",
      "fee": "رایگان"
    },
    "address": "تهران، ستارخان، ..."
  },
  "categories": [...],
  "totalItems": 90,
  "scrapedAt": "2025-10-11T12:34:56.789Z"
}
```

### UI Display
- Logo shows as rounded circle
- Rating displays with star and count
- Discount badge in red
- Delivery info with truck emoji
- Address with location pin
- Clean, professional layout

## Maintenance

### If Selectors Change

Update the `RESTAURANT_SELECTORS` object in `lib/sophisticated-automation.ts`:

```typescript
const RESTAURANT_SELECTORS = {
  name: 'NEW_SELECTOR_HERE',
  // ... update others as needed
};
```

### Adding New Fields

1. Add selector to `RESTAURANT_SELECTORS`
2. Extract data in `extractMenuFromDOM`
3. Add to interface in both files
4. Update return statement
5. Update UI display

### Testing Selectors

```javascript
// In browser console on SnappFood page:
document.querySelector('.VendorLogo__Logo-sc-9mwh1-0 img')?.src
document.querySelector('.RateCommentBadge__RateBox-sc-olkjn5-0 .sc-hKgILt.jsaCNc')?.textContent
```

## Files Modified

1. **lib/sophisticated-automation.ts**
   - Added selector constants
   - Updated extraction logic
   - Enhanced interface
   - Updated return data

2. **components/SnappFoodSearch.tsx**
   - Updated interface to match backend
   - Enhanced UI display
   - Added logo, delivery, discount displays
   - Created beautiful header card

## Testing

1. Start dev server: `npm run dev`
2. Search for vendors
3. Add vendor to saved list
4. Click "مشاهده منو"
5. Check the beautiful new header! 🎨

## Expected Results

✅ Logo displays (if available)
✅ Rating with count shows
✅ Discount badge appears (if applicable)
✅ Delivery info displays
✅ Address shows
✅ All data properly extracted
✅ Beautiful, professional UI

## Troubleshooting

### Logo Not Showing
- Check if restaurant has a logo on SnappFood
- Check console for 404 errors
- Verify selector is correct

### Missing Fields
- Some restaurants might not have all fields
- That's OK - UI conditionally renders
- Check "نمایش داده خام" to see what was extracted

### Selector Not Working
- SnappFood might have updated their HTML
- Open browser console on restaurant page
- Test selector manually
- Update in code if needed

## Summary

Enhanced the menu extraction with:
- ✅ Professional selector set
- ✅ 5 new data fields
- ✅ Beautiful header UI
- ✅ Type-safe interfaces
- ✅ Maintainable code structure
- ✅ Conditional rendering
- ✅ Better user experience

The menu display is now **much more informative and visually appealing**! 🎉

