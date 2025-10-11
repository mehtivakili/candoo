# Quick Start: SnappFood Vendor Menu Extraction

## 🚀 Quick Setup

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test the API**
   ```bash
   curl -X POST http://localhost:3000/api/vendor-menu \
     -H "Content-Type: application/json" \
     -d '{"vendorUrl":"https://snappfood.ir/restaurant/menu/دکتر-کافه-اندرزگو-تهران-a7lzk"}'
   ```

3. **Or Run Test Script**
   ```bash
   node test-vendor-menu-extraction.js
   ```

## 📝 API Usage

### Endpoint
```
POST /api/vendor-menu
```

### Request Body
```json
{
  "vendorUrl": "https://snappfood.ir/restaurant/menu/YOUR-RESTAURANT-URL"
}
```

### Success Response
```json
{
  "success": true,
  "menuData": {
    "restaurant": {
      "name": "Restaurant Name",
      "rating": "4.6",
      "url": "https://snappfood.ir/..."
    },
    "categories": [
      {
        "id": "123",
        "name": "Category Name",
        "itemCount": 5,
        "items": [
          {
            "name": "Product Name",
            "description": "Product Description",
            "pricing": {
              "originalPrice": 100000,
              "finalPrice": 95000,
              "discount": "5%",
              "hasDiscount": true
            },
            "imageUrl": "https://..."
          }
        ]
      }
    ],
    "totalItems": 45,
    "scrapedAt": "2025-10-11T12:34:56.789Z"
  },
  "message": "Successfully extracted 45 items from Restaurant (5 categories)",
  "timestamp": "2025-10-11T12:34:56.789Z"
}
```

## 💻 Code Example

```typescript
// Using the automation class directly
import { SophisticatedSnappFoodAutomation } from '@/lib/sophisticated-automation';

async function extractMenu() {
  const automation = new SophisticatedSnappFoodAutomation();
  
  try {
    await automation.initialize();
    
    const menuData = await automation.extractVendorMenu(
      'https://snappfood.ir/restaurant/menu/...'
    );
    
    // Process the data
    console.log(`Restaurant: ${menuData.restaurant.name}`);
    console.log(`Total Items: ${menuData.totalItems}`);
    
    menuData.categories.forEach(category => {
      console.log(`\n${category.name}:`);
      category.items.forEach(item => {
        console.log(`  - ${item.name}: ${item.pricing.finalPrice} تومان`);
      });
    });
    
  } finally {
    await automation.close();
  }
}
```

## 🔍 What Gets Extracted

✅ **Restaurant Info**
- Name
- Rating
- URL

✅ **Categories**
- Category ID
- Category Name
- Item Count

✅ **Product Items**
- Name
- Description
- Original Price (number)
- Final Price (number)
- Discount Percentage
- Has Discount (boolean)
- Image URL

## 📊 Data Structure

```typescript
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

interface CategoryData {
  id: string;
  name: string;
  itemCount: number;
  items: ProductItem[];
}

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
```

## 🎯 Key Features

1. **Accurate Scraping**: Uses specific DOM selectors for reliable extraction
2. **Clean Data**: Returns structured JSON with proper types
3. **Price Intelligence**: Handles discounts, original prices automatically
4. **Category Organization**: Groups items by category
5. **Image Extraction**: Includes product images
6. **Persian Support**: Handles Persian text correctly

## 🛠️ Troubleshooting

**Problem**: Extraction fails or returns empty data

**Solutions**:
1. Check if browser is running: Browser should open automatically
2. Verify URL format: Must be a SnappFood restaurant menu URL
3. Check network: Ensure you can access SnappFood
4. Wait for page load: Extraction waits for content to load

**Problem**: Selectors not working

**Solution**: SnappFood may have changed their DOM structure. Update selectors in `extractMenuFromDOM` method.

## 📁 Files

- `lib/sophisticated-automation.ts` - Main extraction logic
- `app/api/vendor-menu/route.ts` - API endpoint
- `test-vendor-menu-extraction.js` - Test script
- `DOM_SCRAPING_UPDATE_SUMMARY.md` - Detailed documentation

## 🔗 Example URLs

```
https://snappfood.ir/restaurant/menu/دکتر-کافه-اندرزگو-تهران-a7lzk
https://snappfood.ir/restaurant/menu/پیتزا-شیلا-ستارخان-تهران-xxxxx
```

Replace with actual restaurant URLs from SnappFood.

## ⚠️ Notes

- Extraction requires browser automation (Puppeteer)
- First run may take longer as browser initializes
- Browser stays open between requests for better performance
- Coupon sections (ID: -99) are automatically skipped
- All prices are in تومان (Toman)

## 📞 Support

Check the detailed documentation in `DOM_SCRAPING_UPDATE_SUMMARY.md` for more information about the implementation, data structures, and maintenance.

