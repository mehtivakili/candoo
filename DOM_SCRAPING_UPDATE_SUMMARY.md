# DOM Scraping Update Summary

## Overview
Updated the SnappFood vendor menu extraction to use professional DOM scraping with specific, reliable selectors instead of API interception. This approach is more robust and provides cleaner, more structured data.

## What Was Changed

### 1. **Data Structure Updates** (`lib/sophisticated-automation.ts`)

#### Old Structure:
```typescript
interface ProductItem {
  article_id: string;
  store_id: string;
  store_name: string;
  g1: string;
  price: string;
  discount: string;
  // ... more fields
}

interface VendorMenuData {
  store_id: string;
  store_name: string;
  store_url: string;
  products: ProductItem[];
  categories: string[];
}
```

#### New Structure:
```typescript
interface ProductItem {
  name: string;
  description: string;
  pricing: {
    originalPrice: number | null;
    finalPrice: number | null;
    discount: string | null;
    hasDiscount: boolean;
  };
  imageUrl: string | null;
}

interface CategoryData {
  id: string;
  name: string;
  itemCount: number;
  items: ProductItem[];
}

interface VendorMenuData {
  restaurant: {
    name: string;
    rating: string;
    url: string;
  };
  categories: CategoryData[];
  totalItems: number;
  scrapedAt: string;
}
```

### 2. **Extraction Method** (`extractMenuFromDOM`)

#### Key Features:
- **Professional Selectors**: Uses exact class names from SnappFood's DOM structure
- **Clean Data**: Returns well-structured JSON with proper typing
- **Pricing Intelligence**: Automatically handles discounts, original prices, and final prices
- **Category Organization**: Groups items by category with metadata
- **Image Extraction**: Captures product images

#### Specific Selectors Used:
```typescript
// Restaurant name
'h1.sc-hKgILt.kNFBOq'

// Rating
'.RateCommentBadge__RateBox-sc-olkjn5-0 .sc-hKgILt.jsaCNc'

// Category sections
'section[data-categoryid]'

// Category names
'p.sc-hKgILt.CategorySections__SectionHeading-sc-ls8sfa-0'

// Product cards
'.ProductCard__Box-sc-1wfx2e0-0'

// Product name
'h2.sc-hKgILt.esHHju'

// Product description
'strong.sc-hKgILt.fYlAbO'

// Price footer
'.ProductCard__Footer-sc-1wfx2e0-1'

// Discount badge
'.sc-lmoMRL.cVMWeE'

// Original price (strikethrough)
's.sc-hKgILt.fYlAbO'

// Final price
'.sc-dlfnbm.hmnfCP span.sc-hKgILt.hxREoh'

// Product image
'.ProductCard__ImgWrapper-sc-1wfx2e0-3 img'
```

### 3. **Helper Functions**

```typescript
// Clean text helper
const cleanText = (text: string | null | undefined): string => 
  text?.trim() || '';

// Extract numeric price
const extractPrice = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const cleaned = text.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : null;
};
```

### 4. **API Route Updates** (`app/api/vendor-menu/route.ts`)

Updated to work with new data structure:
```typescript
// Success message now uses new structure
message: `Successfully extracted ${menuData.totalItems} items from ${menuData.restaurant.name} (${menuData.categories.length} categories)`

// Updated API documentation in GET method
```

## Example Output

```json
{
  "restaurant": {
    "name": "پیتزا شیلا (ستارخان)",
    "rating": "۴.۶",
    "url": "https://snappfood.ir/restaurant/menu/..."
  },
  "categories": [
    {
      "id": "123",
      "name": "پیتزا",
      "itemCount": 5,
      "items": [
        {
          "name": "کمبو استریت",
          "description": "پیتزا استریت با نوشابه",
          "pricing": {
            "originalPrice": 775000,
            "finalPrice": 736250,
            "discount": "۵%",
            "hasDiscount": true
          },
          "imageUrl": "https://cdn.snappfood.ir/..."
        }
      ]
    }
  ],
  "totalItems": 45,
  "scrapedAt": "2025-10-11T12:34:56.789Z"
}
```

## How to Use

### 1. **API Endpoint**

```bash
POST /api/vendor-menu
Content-Type: application/json

{
  "vendorUrl": "https://snappfood.ir/restaurant/menu/دکتر-کافه-اندرزگو-تهران-a7lzk"
}
```

### 2. **Response**

```json
{
  "success": true,
  "menuData": {
    "restaurant": { ... },
    "categories": [ ... ],
    "totalItems": 45,
    "scrapedAt": "..."
  },
  "message": "Successfully extracted 45 items from ... (5 categories)",
  "timestamp": "2025-10-11T12:34:56.789Z"
}
```

### 3. **Programmatic Usage**

```typescript
import { SophisticatedSnappFoodAutomation } from '@/lib/sophisticated-automation';

const automation = new SophisticatedSnappFoodAutomation();
await automation.initialize();

const menuData = await automation.extractVendorMenu(
  'https://snappfood.ir/restaurant/menu/...'
);

console.log(`Restaurant: ${menuData.restaurant.name}`);
console.log(`Total Items: ${menuData.totalItems}`);
console.log(`Categories: ${menuData.categories.length}`);

// Access items
menuData.categories.forEach(category => {
  console.log(`\n${category.name} (${category.itemCount} items):`);
  category.items.forEach(item => {
    console.log(`  - ${item.name}: ${item.pricing.finalPrice} تومان`);
    if (item.pricing.hasDiscount) {
      console.log(`    Original: ${item.pricing.originalPrice}, Discount: ${item.pricing.discount}`);
    }
  });
});

await automation.close();
```

## Key Improvements

1. **✅ More Reliable**: Direct DOM scraping is more stable than API interception
2. **✅ Cleaner Data**: Structured JSON with proper typing
3. **✅ Better Pricing**: Automatic discount calculation and price parsing
4. **✅ Category Support**: Full category organization with metadata
5. **✅ Image Extraction**: Product images included
6. **✅ Professional Code**: Clean, maintainable, well-documented
7. **✅ Type Safety**: Full TypeScript support with proper interfaces

## Testing

To test the updated extraction:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test via API:
   ```bash
   curl -X POST http://localhost:3000/api/vendor-menu \
     -H "Content-Type: application/json" \
     -d '{"vendorUrl":"https://snappfood.ir/restaurant/menu/دکتر-کافه-اندرزگو-تهران-a7lzk"}'
   ```

3. Check the response for structured data with categories and items

## Notes

- The extraction skips coupon sections (category ID: -99)
- Prices are converted to numbers for easy calculation
- Persian text is properly handled
- Empty categories are filtered out
- All data is validated before inclusion

## Maintenance

If SnappFood changes their DOM structure:

1. Open a vendor menu page in browser
2. Inspect elements to find new selectors
3. Update selectors in `extractMenuFromDOM` method
4. Test extraction
5. Update documentation

## Files Modified

1. `lib/sophisticated-automation.ts` - Main extraction logic
2. `app/api/vendor-menu/route.ts` - API route updates
3. `DOM_SCRAPING_UPDATE_SUMMARY.md` - This documentation

