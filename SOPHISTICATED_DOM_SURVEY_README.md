# Sophisticated DOM Survey System for SnappFood Automation

This project implements a sophisticated DOM survey system that performs intelligent analysis of web pages to identify key elements for automation. The system uses multiple analysis strategies to ensure robust and adaptive automation.

## 🧠 Key Features

### DOM Survey Service
- **Multi-Strategy Analysis**: Combines 4 different analysis approaches
- **Intelligent Element Detection**: Identifies search inputs, location inputs, search buttons, and result cards
- **Confidence Scoring**: Provides confidence levels for each identified element
- **Adaptive Learning**: Adapts to different website structures automatically

### Analysis Strategies

#### 1. Semantic Analysis (Weight: 40%)
- Analyzes element attributes, text content, and semantic meaning
- Identifies elements based on placeholder text, class names, and IDs
- Uses keyword matching for Persian and English text
- Provides highest accuracy for element type identification

#### 2. Attribute Pattern Matching (Weight: 30%)
- Uses common CSS selectors and attribute patterns
- Matches against known patterns for search inputs, buttons, etc.
- Covers both Persian and English attribute patterns
- Fast and reliable for standard web elements

#### 3. Visual Layout Analysis (Weight: 20%)
- Analyzes element position, size, and visual characteristics
- Identifies elements based on their visual prominence
- Considers viewport positioning and element dimensions
- Helps identify elements that might not have semantic attributes

#### 4. Behavioral Analysis (Weight: 10%)
- Tests element behavior and interaction patterns
- Checks for focus events and suggestion dropdowns
- Validates element functionality
- Provides additional confidence for interactive elements

## 🚀 Usage

### Basic Usage
```typescript
import { DOMSurveyService } from '@/lib/dom-survey-service';

const surveyService = new DOMSurveyService();
await surveyService.initialize();
const result = await surveyService.surveyPage('https://snappfood.ir/');
```

### Sophisticated Automation
```typescript
import { SophisticatedSnappFoodAutomation } from '@/lib/sophisticated-automation';

const automation = new SophisticatedSnappFoodAutomation();
await automation.initialize({
  useSurvey: true,
  surveyUrl: 'https://snappfood.ir/',
  maxRetries: 3,
  timeout: 30000,
  waitForResults: 5000
});
const result = await automation.searchOnSnappFood('pizza');
```

## 📊 API Endpoints

### `/api/dom-survey` (POST)
Performs DOM survey on a given URL.

**Request:**
```json
{
  "url": "https://snappfood.ir/"
}
```

**Response:**
```json
{
  "success": true,
  "message": "DOM survey completed for https://snappfood.ir/",
  "surveyData": {
    "url": "https://snappfood.ir/",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "elements": [...],
    "pageTitle": "SnappFood",
    "pageDescription": "...",
    "recommendations": {
      "searchInput": {...},
      "locationInput": {...},
      "searchButton": {...},
      "resultCards": [...]
    },
    "screenshot": "base64..."
  }
}
```

### `/api/sophisticated-automation` (POST)
Performs sophisticated automation with DOM survey.

**Request:**
```json
{
  "searchTerm": "pizza",
  "useSurvey": true,
  "surveyUrl": "https://snappfood.ir/"
}
```

## 🔧 Configuration Options

### AutomationConfig
```typescript
interface AutomationConfig {
  useSurvey: boolean;           // Enable DOM survey
  surveyUrl?: string;           // URL to survey
  maxRetries: number;          // Maximum retry attempts
  timeout: number;             // Request timeout in ms
  waitForResults: number;      // Wait time for results in ms
}
```

### DOMElement
```typescript
interface DOMElement {
  selector: string;             // CSS selector
  tagName: string;             // HTML tag name
  attributes: Record<string, string>; // Element attributes
  textContent: string;         // Text content
  isVisible: boolean;          // Visibility status
  boundingBox: any;           // Position and size
  confidence: number;         // Confidence score (0-1)
  elementType: 'search-input' | 'location-input' | 'search-button' | 'result-card' | 'unknown';
}
```

## 🎯 Element Types

### Search Input
- Input fields for searching food/restaurants
- Identified by placeholder text containing search keywords
- Supports both Persian and English patterns
- Confidence based on semantic analysis

### Location Input
- Input fields for selecting location/address
- Identified by placeholder text containing location keywords
- Typically appears first on the page
- Used for setting delivery location

### Search Button
- Buttons for submitting searches
- Identified by text content, class names, or position
- Usually positioned near search inputs
- Supports various button types and styles

### Result Cards
- Cards containing search results
- Identified by class names and visual characteristics
- Used for extracting search results
- Supports multiple card layouts

## 🛠️ Development

### Running the Project
```bash
cd snapp
npm install
npm run dev
```

### Testing DOM Survey
Visit `/survey-test` to test the DOM survey functionality on any website.

### Available Pages
- `/` - Main automation interface with mode selection
- `/survey-test` - DOM survey testing tool

## 🔍 How It Works

1. **Initialization**: Browser instance is created with appropriate settings
2. **Navigation**: Target URL is loaded with network idle wait
3. **Multi-Strategy Analysis**: All 4 analysis strategies run in parallel
4. **Element Collection**: Elements are collected from each strategy
5. **Deduplication**: Duplicate elements are removed based on attributes
6. **Ranking**: Elements are ranked by confidence and visibility
7. **Recommendations**: Best elements are selected for each type
8. **Fallback**: If survey fails, falls back to dynamic discovery

## 🎨 UI Features

### Automation Mode Selection
- Choose between Basic and Sophisticated automation
- Visual comparison of features
- Real-time mode switching

### Survey Data Display
- Interactive survey results
- Confidence scores for each element
- Detailed element information
- Screenshot visualization

### Live Logging
- Real-time operation logs
- Timestamped messages
- Success/failure indicators
- Progress tracking

## 🔒 Error Handling

- **Graceful Degradation**: Falls back to basic automation if survey fails
- **Retry Logic**: Automatic retries for failed operations
- **Timeout Protection**: Prevents hanging operations
- **Resource Cleanup**: Proper browser cleanup on errors

## 📈 Performance

- **Parallel Analysis**: Multiple strategies run simultaneously
- **Efficient Selectors**: Optimized CSS selectors for speed
- **Memory Management**: Proper cleanup of browser resources
- **Caching**: Survey results can be cached for repeated use

## 🌐 Browser Support

- **Puppeteer**: Uses Puppeteer for browser automation
- **Chrome**: Optimized for Chrome/Chromium
- **Headless Mode**: Supports both headless and visible modes
- **Mobile Responsive**: Adapts to different screen sizes

## 🚀 Future Enhancements

- **Machine Learning**: ML-based element classification
- **Pattern Learning**: Learn from successful automation patterns
- **Multi-Language**: Support for more languages
- **Performance Optimization**: Faster analysis algorithms
- **Cloud Integration**: Cloud-based survey processing

## 📝 License

This project is part of the Octopus automation suite and follows the same licensing terms.

