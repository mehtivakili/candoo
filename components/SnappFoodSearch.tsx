'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Play, Loader2, AlertCircle, CheckCircle, Brain, Settings, BarChart3, Monitor, Power, Plus, Store, Table, Eye } from 'lucide-react';

interface SearchResult {
  success: boolean;
  message: string;
  results?: any[];
  screenshot?: string;
  surveyData?: any;
  timestamp?: string;
}

interface VendorResult {
  id: number;
  title: string;
  url: string;
  coverImageUrl?: string;
  logoImageUrl?: string;
  rating?: string;
  reviews?: string;
  cuisine?: string;
  deliveryFee?: string;
  discount?: string;
  couponText?: string;
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
    ratingCount?: string;
    url: string;
    logo?: string | null;
    discount?: string;
    delivery?: {
      type: string;
      fee: string;
    };
    address?: string;
  };
  categories: CategoryData[];
  totalItems: number;
  scrapedAt: string;
}

interface SavedVendor {
  id: string;
  title: string;
  url: string;
  store_id: string;
  addedAt: string;
  coverImageUrl?: string;
  logoImageUrl?: string;
  rating?: string;
  reviews?: string;
}

interface BrowserStatus {
  isOpen: boolean;
  sessionId: string;
}

interface AutomationMode {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
}

export default function SnappFoodSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [vendorResults, setVendorResults] = useState<VendorResult[] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState('products');
  const [sophisticatedSearchType, setSophisticatedSearchType] = useState('products');
  const [urlSearchType, setUrlSearchType] = useState('products');
  const [showSurveyData, setShowSurveyData] = useState(false);
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>({ isOpen: false, sessionId: 'no-session' });
  const [isClosingBrowser, setIsClosingBrowser] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [savingVendorId, setSavingVendorId] = useState<string | null>(null);

  const automationModes: AutomationMode[] = [
    {
      id: 'products',
      name: 'جستجوی محصولات',
      description: 'جستجو برای غذاها و محصولات',
      endpoint: '/api/sophisticated-automation',
      icon: <Search className="w-5 h-5" />
    },
    {
      id: 'vendors',
      name: 'جستجوی فروشگاه‌ها',
      description: 'جستجو برای رستوران‌ها و فروشگاه‌ها',
      endpoint: '/api/sophisticated-automation',
      icon: <Store className="w-5 h-5" />
    }
  ];

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkBrowserStatus = async () => {
    try {
      const response = await fetch('/api/sophisticated-automation');
      
      // Check if response is ok and has content
      if (!response.ok) {
        console.error('Browser status check failed:', response.status);
        return;
      }
      
      const text = await response.text();
      
      // Check if response has content before parsing
      if (!text || text.trim() === '') {
        console.error('Browser status response is empty');
        return;
      }
      
      const data = JSON.parse(text);
      setBrowserStatus(data.browserStatus || { isOpen: false, sessionId: 'no-session' });
    } catch (error) {
      console.error('Failed to check browser status:', error);
      // Set default status on error
      setBrowserStatus({ isOpen: false, sessionId: 'no-session' });
    }
  };

  const closeBrowser = async () => {
    setIsClosingBrowser(true);
    addLog('🔒 Closing browser instance...');
    
    try {
      const response = await fetch('/api/sophisticated-automation', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      
      if (data.success) {
        addLog('✅ Browser closed successfully');
        setBrowserStatus({ isOpen: false, sessionId: 'no-session' });
      } else {
        addLog(`❌ Failed to close browser: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error closing browser:', error);
      addLog(`❌ Error closing browser: ${error instanceof Error ? error.message : String(error)}`);
      // Set closed status anyway
      setBrowserStatus({ isOpen: false, sessionId: 'no-session' });
    } finally {
      setIsClosingBrowser(false);
    }
  };

  useEffect(() => {
    checkBrowserStatus();
    // Check browser status every 30 seconds
    const interval = setInterval(checkBrowserStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const startSearch = async () => {
    if (!searchTerm.trim()) {
      alert('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setVendorResults(null);
    setLogs([]);
    setShowSurveyData(false);
    
    const selectedModeData = automationModes.find(mode => mode.id === selectedMode);
    addLog(`Starting ${selectedModeData?.name} for "${searchTerm}"...`);
    
    if (selectedMode === 'products') {
      addLog(`🍕 Searching for products...`);
      addLog(`🔗 Navigating to: https://snappfood.ir/products/?query=${encodeURIComponent(searchTerm)}`);
    } else if (selectedMode === 'vendors') {
      addLog(`🏪 Searching for vendors...`);
      addLog(`🔗 Navigating to: https://snappfood.ir/search/?query=${encodeURIComponent(searchTerm)}`);
      addLog(`🖱️ Will click "مشاهده همه فروشندگان" to get all vendors`);
    }
    
    if (browserStatus.isOpen) {
      addLog(`✅ Reusing existing browser instance (Session: ${browserStatus.sessionId})`);
    } else {
      addLog(`🔄 Starting new browser instance...`);
    }

    try {
      const requestBody: any = {
        searchTerm: searchTerm.trim(),
        searchType: selectedMode,
        useSurvey: true,
        surveyUrl: 'https://snappfood.ir/'
      };

      const response = await fetch(selectedModeData?.endpoint || '/api/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      
      if (selectedMode === 'vendors') {
        setVendorResults(data.vendors || []);
      } else {
        setResult(data);
      }
      
      if (data.success) {
        addLog(`✅ Search completed successfully!`);
        if (selectedMode === 'vendors') {
          addLog(`📊 Found ${data.vendors?.length || 0} vendors`);
        } else {
          addLog(`📊 Found ${data.results?.length || 0} products`);
        }
        
        if (data.surveyData) {
          addLog(`🔍 DOM survey found ${data.surveyData.elements?.length || 0} elements`);
          addLog(`🎯 Recommended elements identified`);
        }
        
        // Refresh browser status after successful search
        await checkBrowserStatus();
      } else {
        addLog(`❌ Search failed: ${data.message}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      if (selectedMode === 'vendors') {
        setVendorResults([]);
      } else {
        setResult({
          success: false,
          message: `Network error: ${error}`
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add vendor by direct URL and save to database
  const addVendorByUrl = async () => {
    if (!directUrl.trim()) {
      alert('❌ لطفاً آدرس URL را وارد کنید');
      return;
    }

    // Validate URL
    if (!directUrl.includes('snappfood.ir/restaurant')) {
      alert('❌ آدرس وارد شده معتبر نیست\n\nلطفاً آدرس کامل رستوران از SnappFood را وارد کنید\n\nمثال: https://snappfood.ir/restaurant/menu/...');
      return;
    }

    try {
      setIsAddingUrl(true);
      addLog(`📥 Loading menu from URL and saving to database...`);

      // Step 1: Load menu data
      const menuResponse = await fetch('/api/vendor-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorUrl: directUrl }),
      });

      if (!menuResponse.ok) {
        throw new Error(`HTTP error! status: ${menuResponse.status}`);
      }

      const menuText = await menuResponse.text();
      if (!menuText || menuText.trim() === '') {
        throw new Error('Empty response from server');
      }

      const menuData = JSON.parse(menuText);

      if (!menuData.success || !menuData.menuData) {
        throw new Error(menuData.message || 'Failed to load menu');
      }

      addLog(`✅ Menu loaded: ${menuData.menuData.totalItems || 0} items`);

      // Step 2: Save to database
      const saveResponse = await fetch('/api/save-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menuData: menuData.menuData }),
      });

      const saveText = await saveResponse.text();
      if (!saveText || saveText.trim() === '') {
        throw new Error('Empty response from save endpoint');
      }

      const saveData = JSON.parse(saveText);

      if (saveData.success) {
        addLog(`✅ ${saveData.message}`);
        alert(`✅ موفق!\n\n${saveData.message}\n\nرستوران: ${saveData.data?.vendorName}\nتعداد دسته‌بندی: ${saveData.data?.categoriesCount}\nتعداد کل محصولات: ${saveData.data?.totalItems}`);
        setDirectUrl('');
        
        // Close browser after saving
        await closeBrowser();
      } else {
        throw new Error(saveData.error || 'Failed to save menu');
      }

    } catch (error) {
      console.error('❌ Error in URL save:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ Error: ${errorMessage}`);
      
      if (errorMessage.includes('timeout') || errorMessage.includes('took too long')) {
        alert(`⚠️ خطا در بارگذاری منو\n\nصفحه خیلی طول کشید. لطفاً:\n- اتصال اینترنت خود را بررسی کنید\n- دوباره تلاش کنید`);
      } else if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
        alert(`❌ خطا در اتصال به پایگاه داده\n\nلطفاً مطمئن شوید PostgreSQL در حال اجرا است\n\nخطا: ${errorMessage}`);
      } else {
        alert(`❌ خطا در ذخیره‌سازی\n\n${errorMessage}`);
      }
    } finally {
      setIsAddingUrl(false);
    }
  };

  // Directly save vendor to database (without opening menu UI)
  const saveVendorDirectlyToDb = async (vendor: SavedVendor) => {
    try {
      setSavingVendorId(vendor.id);
      addLog(`💾 Loading and saving menu for "${vendor.title}" directly...`);

      // Step 1: Load menu data
      const menuResponse = await fetch('/api/vendor-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorUrl: vendor.url }),
      });

      if (!menuResponse.ok) {
        throw new Error(`HTTP error! status: ${menuResponse.status}`);
      }

      const menuText = await menuResponse.text();
      if (!menuText || menuText.trim() === '') {
        throw new Error('Empty response from server');
      }

      const menuData = JSON.parse(menuText);

      if (!menuData.success || !menuData.menuData) {
        throw new Error(menuData.message || 'Failed to load menu');
      }

      addLog(`✅ Menu loaded: ${menuData.menuData.totalItems || 0} items`);

      // Step 2: Save to database
      const saveResponse = await fetch('/api/save-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menuData: menuData.menuData }),
      });

      const saveText = await saveResponse.text();
      if (!saveText || saveText.trim() === '') {
        throw new Error('Empty response from save endpoint');
      }

      const saveData = JSON.parse(saveText);

      if (saveData.success) {
        addLog(`✅ ${saveData.message}`);
        alert(`✅ موفق!\n\nرستوران با موفقیت به پایگاه داده اضافه شد\n\n${saveData.message}\n\nرستوران: ${saveData.data?.vendorName}\nتعداد دسته‌بندی: ${saveData.data?.categoriesCount}\nتعداد کل محصولات: ${saveData.data?.totalItems}`);
        
        // Close browser after saving
        await closeBrowser();
      } else {
        throw new Error(saveData.error || 'Failed to save menu');
      }

    } catch (error) {
      console.error('❌ Error in direct save:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ Error: ${errorMessage}`);
      
      if (errorMessage.includes('timeout') || errorMessage.includes('took too long')) {
        alert(`⚠️ خطا در بارگذاری منو\n\nصفحه خیلی طول کشید. لطفاً:\n- اتصال اینترنت خود را بررسی کنید\n- دوباره تلاش کنید`);
      } else if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
        alert(`❌ خطا در اتصال به پایگاه داده\n\nلطفاً مطمئن شوید PostgreSQL در حال اجرا است\n\nخطا: ${errorMessage}`);
      } else {
        alert(`❌ خطا در ذخیره‌سازی\n\n${errorMessage}`);
      }
    } finally {
      setSavingVendorId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍕 پنل مدیریت اطلاعات رستوران
          </h1>
          <p className="text-gray-600 text-lg">
            دریافت و تحلیل منو، قیمت و تخفیفات رستوران‌های اسنپ‌فود
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/statistics"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
            >
              <BarChart3 className="w-5 h-5" />
              بررسی آمار
            </Link>
          </div>
        </div>

        {/* Automation Mode Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Automation Mode
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automationModes.map((mode) => (
              <div
                key={mode.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMode === mode.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    selectedMode === mode.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {mode.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800">{mode.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{mode.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sophisticated Search Type Selection */}
        {selectedMode === 'sophisticated' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Sophisticated Search Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  sophisticatedSearchType === 'products'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSophisticatedSearchType('products')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    sophisticatedSearchType === 'products' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Food Products</h3>
                </div>
                <p className="text-sm text-gray-600">Search for specific food items and dishes</p>
              </div>
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  sophisticatedSearchType === 'vendors'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSophisticatedSearchType('vendors')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    sophisticatedSearchType === 'vendors' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Restaurants/Vendors</h3>
                </div>
                <p className="text-sm text-gray-600">Search for restaurants and food vendors</p>
              </div>
            </div>
          </div>
        )}

        {/* URL Search Type Selection */}
        {selectedMode === 'url-search' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Monitor className="w-6 h-6 text-blue-600" />
              URL Search Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  urlSearchType === 'products'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setUrlSearchType('products')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    urlSearchType === 'products' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Food Products</h3>
                </div>
                <p className="text-sm text-gray-600">Search for specific food items and dishes</p>
              </div>
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  urlSearchType === 'vendors'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setUrlSearchType('vendors')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    urlSearchType === 'vendors' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Restaurants/Vendors</h3>
                </div>
                <p className="text-sm text-gray-600">Search for restaurants and food vendors</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to search for?
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input
                  id="searchTerm"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g., pizza, burger, sushi, pasta..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg text-gray-900 placeholder-gray-500 font-medium bg-white"
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && startSearch()}
                />
              </div>
            </div>
            <button
              onClick={startSearch}
              disabled={isLoading || !searchTerm.trim()}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
        </div>

          {/* Direct URL Input */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ➕ افزودن مستقیم رستوران با URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://snappfood.ir/restaurant/menu/..."
                  className="w-full px-4 py-2.5 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base text-gray-900 placeholder-gray-500 font-medium bg-white"
                  disabled={isAddingUrl}
                  onKeyPress={(e) => e.key === 'Enter' && !isAddingUrl && addVendorByUrl()}
                  dir="ltr"
                />
            </div>
              <button
                onClick={addVendorByUrl}
                disabled={isAddingUrl || !directUrl.trim()}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-colors whitespace-nowrap"
              >
                {isAddingUrl ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال افزودن...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>افزودن</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              💡 آدرس کامل صفحه منوی رستوران را از SnappFood کپی کنید
            </p>
          </div>
        </div>


        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Survey Data Toggle */}
            {result.surveyData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    DOM Survey Analysis
                  </h2>
                  <button
                    onClick={() => setShowSurveyData(!showSurveyData)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    {showSurveyData ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{result.surveyData.elements?.length || 0}</div>
                    <div className="text-sm text-gray-600">Total Elements</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.surveyData.recommendations?.searchInput ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-600">Search Input</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.surveyData.recommendations?.locationInput ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-600">Location Input</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{result.surveyData.recommendations?.searchButton ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-600">Search Button</div>
                  </div>
                </div>

                {showSurveyData && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Page Information:</h3>
                      <div className="text-sm text-gray-600">
                        <div><strong>Title:</strong> {result.surveyData.pageTitle}</div>
                        <div><strong>URL:</strong> {result.surveyData.url}</div>
                        <div><strong>Survey Time:</strong> {new Date(result.surveyData.timestamp).toLocaleString()}</div>
                      </div>
                    </div>

                    {result.surveyData.recommendations && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Recommended Elements:</h3>
                        <div className="space-y-2 text-sm">
                          {result.surveyData.recommendations.searchInput && (
                            <div className="p-2 bg-blue-50 rounded">
                              <strong>Search Input:</strong> {result.surveyData.recommendations.searchInput.selector} 
                              <span className="text-blue-600 ml-2">(Confidence: {(result.surveyData.recommendations.searchInput.confidence * 100).toFixed(1)}%)</span>
                            </div>
                          )}
                          {result.surveyData.recommendations.locationInput && (
                            <div className="p-2 bg-green-50 rounded">
                              <strong>Location Input:</strong> {result.surveyData.recommendations.locationInput.selector}
                              <span className="text-green-600 ml-2">(Confidence: {(result.surveyData.recommendations.locationInput.confidence * 100).toFixed(1)}%)</span>
                            </div>
                          )}
                          {result.surveyData.recommendations.searchButton && (
                            <div className="p-2 bg-orange-50 rounded">
                              <strong>Search Button:</strong> {result.surveyData.recommendations.searchButton.selector}
                              <span className="text-orange-600 ml-2">(Confidence: {(result.surveyData.recommendations.searchButton.confidence * 100).toFixed(1)}%)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Results - Full Width */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <h2 className="text-xl font-semibold text-gray-800">
                  {result.success ? 'Search Completed' : 'Search Failed'}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">{result.message}</p>
              
              {result.success && result.results && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 text-lg">Found Results:</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {result.results.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                        {/* Restaurant/Vendor Name */}
                        <div className="p-3 pb-1">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {item.vendor || 'رستوران'}
                          </div>
                          {item.deliveryFee && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.deliveryFee}
                            </div>
                          )}
                        </div>
                        
                        {/* Food Image */}
                        <div className="relative h-32 bg-gray-100">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.imageAlt || item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <div className="text-2xl mb-1">🍽️</div>
                                <div className="text-xs">تصویر غذا</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Rating and Reviews */}
                        <div className="p-3 pt-2">
                          {item.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-yellow-500 text-sm">⭐</span>
                              <span className="text-sm font-medium text-gray-700">
                                {item.rating}
                              </span>
                              {item.reviews && (
                                <span className="text-xs text-gray-500">
                                  ({item.reviews})
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Food Title */}
                          <div className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                            {item.title || 'غذا'}
                          </div>
                          
                          {/* Price */}
                          {item.price && (
                            <div className="text-lg font-bold text-orange-600">
                              {item.price}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vendor Results */}
        {selectedMode === 'vendors' && vendorResults && vendorResults.length > 0 && (
          <div className="bg-gray-50 rounded-xl shadow-inner p-6 mt-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    جستجوی فروشگاه‌ها تکمیل شد
                  </h2>
                </div>
                <p className="text-gray-600 mb-4">Found {vendorResults.length} vendors for "{searchTerm}"</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">Found Vendors:</h3>
                <div className="grid grid-cols-5 gap-4">
                  {vendorResults.map((vendor, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 flex flex-col"
                    >
                      {/* Vendor Cover Image */}
                      <div className="relative w-full h-32 bg-gray-200 flex items-center justify-center">
                        {vendor.coverImageUrl ? (
                          <img
                            src={vendor.coverImageUrl}
                            alt={vendor.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-food.png'; }}
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">No Cover Image</div>
                        )}
                        {/* Vendor Logo */}
                        {vendor.logoImageUrl && (
                          <div className="absolute bottom-2 left-2 w-16 h-16 rounded-full bg-white border-2 border-white shadow-md">
                            <img
                              src={vendor.logoImageUrl}
                              alt={`${vendor.title} logo`}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-logo.png'; }}
                            />
                          </div>
                        )}
                        {/* Discount Badge */}
                        {vendor.discount && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {vendor.discount}
                          </div>
                        )}
                        {/* Coupon Badge (simplified) */}
                        {vendor.couponText && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {vendor.couponText.split(' و ')[0]}
                          </div>
                        )}
                      </div>

                      {/* Vendor Info */}
                      <div className="p-3 flex-grow">
                        <h2 className="text-base font-semibold text-gray-800 line-clamp-2 mb-1">
                          {vendor.title}
                        </h2>
                        {vendor.cuisine && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {vendor.cuisine}
                          </p>
                        )}
                        <div className="flex items-center text-sm text-gray-700 mb-2">
                          {vendor.rating && (
                            <>
                              <span className="text-yellow-500 mr-1">★</span>
                              <span className="font-medium">{vendor.rating}</span>
                              {vendor.reviews && (
                                <span className="text-gray-500 ml-1">({vendor.reviews})</span>
                              )}
                            </>
                          )}
                        </div>
                        {vendor.deliveryFee && (
                          <div className="text-sm text-gray-600">
                            <span className="text-gray-500">Delivery: </span>
                            <span className="font-medium text-orange-600">{vendor.deliveryFee}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <div className="p-3 pt-0">
                        <button
                          onClick={() => saveVendorDirectlyToDb({
                            id: vendor.store_id || vendor.title,
                            title: vendor.title,
                            url: vendor.url,
                            store_id: vendor.store_id,
                            rating: vendor.rating,
                            reviews: vendor.reviews,
                            addedAt: new Date().toISOString()
                          })}
                          disabled={savingVendorId === (vendor.store_id || vendor.title)}
                          className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-1 font-medium"
                        >
                          {savingVendorId === (vendor.store_id || vendor.title) ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>در حال ذخیره...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>ذخیره در DB</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
