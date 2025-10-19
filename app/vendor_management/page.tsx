'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Users,
  Timer,
  Database,
  Zap,
  CheckCircle2,
  RotateCcw,
  Trash2,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Search,
  Brain,
  Monitor,
  Power,
  Plus,
  Store,
  Table,
  Eye,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import './styles.css';

interface VendorItem {
  id: number;
  article_id: string;
  description: string;
  price: string;
  original_price: string;
  has_discount: boolean;
  discount: string;
  image_url: string;
  vendor_id: string;
  vendor_name: string;
  category: string;
  updated_at: string;
}

interface Vendor {
  vendor_id: string;
  vendor_name: string;
  total_items: number;
  recent_updates?: number; // Items updated in last 24h
  auto_update_enabled: boolean;
  last_updated: string;
  status?: string; // active, inactive, stale
}

interface SchedulerConfig {
  enabled: boolean;
  days: string[];
  hour: number;
  minute: number;
  maxVendorsPerRun: number;
  delayBetweenVendors: number;
}

interface UpdateSession {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  results?: Array<{
    vendorId: string;
    success: boolean;
    itemsUpdated?: number;
    error?: string;
  }>;
}

interface BrowserStatus {
  isOpen: boolean;
  sessionId: string;
}

// Scraping interfaces
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
  store_id?: string;
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

interface AutomationMode {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
}

export default function VendorManagement() {
  // Price update management states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [config, setConfig] = useState<SchedulerConfig>({
    enabled: false,
    days: [],
    hour: 9,
    minute: 0,
    maxVendorsPerRun: 5,
    delayBetweenVendors: 2000
  });
  const [currentSession, setCurrentSession] = useState<UpdateSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [updatingVendors, setUpdatingVendors] = useState<Set<string>>(new Set());
  const [completedVendors, setCompletedVendors] = useState<Set<string>>(new Set());
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [vendorItems, setVendorItems] = useState<{[key: string]: VendorItem[]}>({});
  const [loadingVendorItems, setLoadingVendorItems] = useState<Set<string>>(new Set());
  const [displayedItemsCount, setDisplayedItemsCount] = useState<{[key: string]: number}>({});

  // Scraping states
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [scrapingResult, setScrapingResult] = useState<SearchResult | null>(null);
  const [vendorResults, setVendorResults] = useState<VendorResult[] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState('products');
  const [sophisticatedSearchType, setSophisticatedSearchType] = useState('products');
  const [urlSearchType, setUrlSearchType] = useState('products');
  const [showSurveyData, setShowSurveyData] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [savingVendorId, setSavingVendorId] = useState<string | null>(null);

  // Browser status states
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>({ isOpen: false, sessionId: 'no-session' });
  const [isClosingBrowser, setIsClosingBrowser] = useState(false);

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

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'هیچ‌وقت';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'تاریخ نامعتبر';
      }
      
      // Try Persian date formatting first
      try {
        return date.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (persianError) {
        // Fallback to English format if Persian formatting fails
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return 'تاریخ نامعتبر';
    }
  };

  const daysOfWeek = [
    { key: 'saturday', label: 'شنبه' },
    { key: 'sunday', label: 'یکشنبه' },
    { key: 'monday', label: 'دوشنبه' },
    { key: 'tuesday', label: 'سه‌شنبه' },
    { key: 'wednesday', label: 'چهارشنبه' },
    { key: 'thursday', label: 'پنج‌شنبه' },
    { key: 'friday', label: 'جمعه' }
  ];

  const startSearch = async () => {
    if (!searchTerm.trim()) {
      alert('Please enter a search term');
      return;
    }

    setIsScrapingLoading(true);
    setScrapingResult(null);
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
        setScrapingResult(data);
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
        setScrapingResult({
          success: false,
          message: `Network error: ${error}`
        });
      }
    } finally {
      setIsScrapingLoading(false);
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
        
        // Keep browser alive for next operation
        addLog('🔄 Browser kept alive for next operation');
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
        
        // Keep browser alive for next operation
        addLog('🔄 Browser kept alive for next operation');
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

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/price-update/vendors');
      const data = await response.json();
      if (data.success) {
        setVendors(data.vendors);
      }
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/price-update/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const loadSessionStatus = async () => {
    try {
      const response = await fetch('/api/price-update/session');
      const data = await response.json();
      
      if (data.success && data.session) {
        const session = data.session;
        setCurrentSession(session);

        // If session is completed, clear updating vendors and mark completed ones
        if (session.status === 'completed') {
          setUpdatingVendors(new Set());
          if (session.results) {
            const completedVendorIds = session.results
              .filter((result: any) => result.success)
              .map((result: any) => result.vendorId);
            setCompletedVendors(new Set(completedVendorIds));
            
            // Clear completion status after showing it briefly
            setTimeout(() => {
              setCompletedVendors(new Set());
            }, 2000);
          }
          
          // Refresh vendor data to show updated information
          await loadVendors();
          
          // Clear session immediately to stop polling
          setCurrentSession(null);
        }
      } else {
        setCurrentSession(null);
      }
    } catch (err) {
      console.error('Failed to load session status:', err);
      setCurrentSession(null);
    }
  };

  const updateConfig = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/price-update/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('تنظیمات با موفقیت ذخیره شد');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('خطا در ذخیره تنظیمات');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualUpdate = async (vendorIds?: string[]) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Clear previous states
    setUpdatingVendors(new Set());
    setCompletedVendors(new Set());

    try {
      const response = await fetch('/api/price-update/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorIds }),
      });

      const data = await response.json();
      if (data.success) {
        const session = data.session;
        setCurrentSession(session);

        // Check if session is already completed
        if (session?.status === 'completed') {
          setSuccess('به‌روزرسانی با موفقیت انجام شد');

          // Clear updating vendors and mark completed ones
          if (session.results) {
            const completedVendorIds = session.results
              .filter((result: any) => result.success)
              .map((result: any) => result.vendorId);

            setCompletedVendors(new Set(completedVendorIds));
            setUpdatingVendors(new Set());

            // Refresh vendor data to show updated information
            await loadVendors();

            // Clear completion status after showing it briefly
            setTimeout(() => {
              setCompletedVendors(new Set());
            }, 2000);
          } else {
            setUpdatingVendors(new Set());
            // Still refresh vendor data even if no results
            await loadVendors();
          }

          // Clear session immediately
          setCurrentSession(null);
        } else {
          setSuccess('به‌روزرسانی شروع شد');

          // Mark vendors as updating
          if (vendorIds) {
            setUpdatingVendors(new Set(vendorIds));
          } else {
            // If no specific vendors, mark all vendors as updating
            setUpdatingVendors(new Set(vendors.map(v => v.vendor_id)));
          }
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('خطا در شروع به‌روزرسانی');
    } finally {
      setIsLoading(false);
    }
  };

  const updateVendor = async (vendorId: string) => {
    await triggerManualUpdate([vendorId]);
  };

  const updateAllVendors = async () => {
    await triggerManualUpdate();
  };

  const updateSelectedVendors = async () => {
    if (selectedVendors.length === 0) {
      setError('لطفاً حداقل یک رستوران را انتخاب کنید');
      return;
    }
    await triggerManualUpdate(selectedVendors);
  };

  const activateAllVendors = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/price-update/vendor-toggle-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      });

      const data = await response.json();
      if (data.success) {
        setVendors(prev => prev.map(vendor => ({ ...vendor, auto_update_enabled: true })));
        setSuccess('همه رستوران‌ها فعال شدند');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('خطا در فعال‌سازی همه رستوران‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateAllVendors = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/price-update/vendor-toggle-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      });

      const data = await response.json();
      if (data.success) {
        setVendors(prev => prev.map(vendor => ({ ...vendor, auto_update_enabled: false })));
        setSuccess('همه رستوران‌ها غیرفعال شدند');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('خطا در غیرفعال‌سازی همه رستوران‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVendorAutoUpdate = async (vendorId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/price-update/vendor-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, enabled }),
      });

      const data = await response.json();
      if (data.success) {
        setVendors(prev => prev.map(vendor => 
          vendor.vendor_id === vendorId 
            ? { ...vendor, auto_update_enabled: enabled }
            : vendor
        ));
        setSuccess(`به‌روزرسانی خودکار ${enabled ? 'فعال' : 'غیرفعال'} شد`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('خطا در تغییر وضعیت به‌روزرسانی خودکار');
    }
  };

  const toggleVendorExpansion = async (vendorId: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
        // Load vendor items when expanding
        if (!vendorItems[vendorId]) {
          loadVendorItems(vendorId);
        }
      }
      return newSet;
    });
  };

  const loadVendorItems = async (vendorId: string) => {
    setLoadingVendorItems(prev => new Set([...prev, vendorId]));
    
    try {
      // Properly encode the vendor ID to handle URLs with slashes
      const encodedVendorId = encodeURIComponent(vendorId);
      const response = await fetch(`/api/price-update/vendor-items/${encodedVendorId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`Loaded ${data.items.length} items for vendor ${vendorId}`);
        console.log('Sample items with images:', data.items.slice(0, 3).map((item: any) => ({
          id: item.id,
          name: item.article_id,
          image_url: item.image_url,
          has_image: !!item.image_url
        })));
        
        setVendorItems(prev => ({
          ...prev,
          [vendorId]: data.items
        }));
        // Initialize displayed count to 12
        setDisplayedItemsCount(prev => ({
          ...prev,
          [vendorId]: 12
        }));
      } else {
        console.error('Failed to load vendor items:', data.message);
      }
    } catch (err) {
      console.error('Failed to load vendor items:', err);
    } finally {
      setLoadingVendorItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  };

  const loadMoreItems = (vendorId: string) => {
    setDisplayedItemsCount(prev => ({
      ...prev,
      [vendorId]: (prev[vendorId] || 12) + 30
    }));
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این رستوران را حذف کنید؟')) {
      return;
    }

    try {
      const response = await fetch('/api/price-update/vendors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId }),
      });

      const data = await response.json();
      if (data.success) {
        setVendors(prev => prev.filter(v => v.vendor_id !== vendorId));
        setSuccess('رستوران با موفقیت حذف شد');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('خطا در حذف رستوران');
    }
  };

  const checkBrowserStatus = async () => {
    try {
      const response = await fetch('/api/sophisticated-automation');
      
      if (!response.ok) {
        console.error('Browser status check failed:', response.status);
        return;
      }
      
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        console.error('Browser status response is empty');
        return;
      }
      
      const data = JSON.parse(text);
      setBrowserStatus(data.browserStatus || { isOpen: false, sessionId: 'no-session' });
    } catch (error) {
      console.error('Failed to check browser status:', error);
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
      setBrowserStatus({ isOpen: false, sessionId: 'no-session' });
    } finally {
      setIsClosingBrowser(false);
    }
  };

  const clearStuckStatuses = () => {
    setUpdatingVendors(new Set());
    setCompletedVendors(new Set());
    setCurrentSession(null);
  };

  useEffect(() => {
    loadVendors();
    loadConfig();
    loadSessionStatus();
    checkBrowserStatus();
    
    // Clear any stuck statuses on load
    setUpdatingVendors(new Set());
    setCompletedVendors(new Set());
  }, []);

  // Poll for session status updates
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(async () => {
      await loadSessionStatus();
    }, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession?.status]);

  const toggleDay = (day: string) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت رستوران‌ها</h1>
              <p className="text-gray-600">جمع‌آوری داده و مدیریت به‌روزرسانی قیمت‌ها</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <Link
                  href="/statistics"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  آمار و گزارشات
                </Link>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Monitor className="w-4 h-4" />
                <span>Browser: {browserStatus.isOpen ? '🟢 Active' : '🔴 Inactive'}</span>
              </div>
              {browserStatus.isOpen && (
                <button
                  onClick={closeBrowser}
                  disabled={isClosingBrowser}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm flex items-center gap-1"
                >
                  {isClosingBrowser ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                  Close Browser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <div className="flex items-center gap-2">
              {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              <span>{error || success}</span>
            </div>
          </div>
        )}

        {/* Scraping Section - New Modern Look */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Search className="w-5 h-5" />
              جمع‌آوری داده از اسنپ‌فود
            </h2>
          </div>
          <div className="p-6">
              {/* Modern Search Input */}
              <div className="mb-6">
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جستجو برای غذا، رستوران یا محصول..."
                    className="w-full pl-4 pr-20 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                    onKeyPress={(e) => e.key === 'Enter' && startSearch()}
                  />
                  <button
                    onClick={startSearch}
                    disabled={isScrapingLoading || !searchTerm.trim()}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-all duration-200"
                  >
                    {isScrapingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    جستجو
                  </button>
                </div>
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
                      placeholder="آدرس مستقیم رستوران..."
                      className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                    />
                    <button
                      onClick={addVendorByUrl}
                      disabled={isAddingUrl || !directUrl.trim()}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-all duration-200"
                    >
                      {isAddingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      افزودن مستقیم
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 آدرس کامل صفحه منوی رستوران را از SnappFood کپی کنید
                </p>
              </div>
            </div>
          </div>

        {/* Scheduler Settings and Vendor List Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Scheduler Settings - Smaller Width */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  تنظیمات برنامه‌ریز
                </h2>
              </div>
          <div className="p-6 space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">فعال‌سازی خودکار</h3>
                <p className="text-sm text-gray-600">به‌روزرسانی خودکار در زمان مشخص</p>
              </div>
              <div className="flex-shrink-0">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>

            {/* Days Selection */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">روزهای هفته</h3>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => toggleDay(day.key)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                      config.days.includes(day.key)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-xs text-center">{day.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection with Up/Down Controls - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">دقیقه</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, minute: Math.min(59, prev.minute + 1) }))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={config.minute}
                    onChange={(e) => setConfig(prev => ({ ...prev, minute: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, minute: Math.max(0, prev.minute - 1) }))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ساعت</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, hour: Math.min(23, prev.hour + 1) }))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.hour}
                    onChange={(e) => setConfig(prev => ({ ...prev, hour: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, hour: Math.max(0, prev.hour - 1) }))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">حداکثر رستوران در هر اجرا</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={config.maxVendorsPerRun}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxVendorsPerRun: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاخیر بین رستوران‌ها (میلی‌ثانیه)</label>
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="500"
                  value={config.delayBetweenVendors}
                  onChange={(e) => setConfig(prev => ({ ...prev, delayBetweenVendors: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={updateConfig}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                ذخیره تنظیمات
              </button>
            </div>
              </div>
            </div>
          </div>

          {/* Vendor List - Larger Width */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                لیست رستوران‌ها
              </h2>
              <div className="flex items-center gap-2">
                <div className="text-sm text-white/80 mr-2">
                  {vendors.filter(v => v.auto_update_enabled).length} فعال / {vendors.length} کل
                </div>
                <button
                  onClick={activateAllVendors}
                  disabled={isLoading || vendors.length === 0}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  فعال‌سازی همه
                </button>
                <button
                  onClick={deactivateAllVendors}
                  disabled={isLoading || vendors.length === 0}
                  className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  غیرفعال‌سازی همه
                </button>
                <button
                  onClick={updateAllVendors}
                  disabled={isLoading || vendors.length === 0}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  به‌روزرسانی همه
                </button>
                <button
                  onClick={updateSelectedVendors}
                  disabled={isLoading || selectedVendors.length === 0}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  به‌روزرسانی انتخاب شده
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {vendors.map((vendor) => {
                const isExpanded = expandedVendors.has(vendor.vendor_id);
                const isUpdating = updatingVendors.has(vendor.vendor_id);
                const isCompleted = completedVendors.has(vendor.vendor_id);
                const vendorStatus = isUpdating ? 'updating' : isCompleted ? 'completed' : 'idle';

                return (
                  <div key={vendor.vendor_id} className="bg-gray-50 rounded-lg border border-gray-200">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleVendorExpansion(vendor.vendor_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVendorExpansion(vendor.vendor_id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                          </button>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteVendor(vendor.vendor_id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateVendor(vendor.vendor_id);
                              }}
                              disabled={vendorStatus === 'updating'}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {vendorStatus === 'updating' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                            
                            {/* Stylish Checkbox */}
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={selectedVendors.includes(vendor.vendor_id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (e.target.checked) {
                                    setSelectedVendors(prev => [...prev, vendor.vendor_id]);
                                  } else {
                                    setSelectedVendors(prev => prev.filter(id => id !== vendor.vendor_id));
                                  }
                                }}
                                className="sr-only"
                                id={`checkbox-${vendor.vendor_id}`}
                              />
                              <label
                                htmlFor={`checkbox-${vendor.vendor_id}`}
                                className="flex items-center justify-center w-6 h-6 border-2 border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {selectedVendors.includes(vendor.vendor_id) && (
                                  <CheckCircle className="w-4 h-4 text-blue-600" />
                                )}
                              </label>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{vendor.vendor_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="text-gray-900">{vendor.total_items} آیتم</span>
                              {vendor.recent_updates && vendor.recent_updates > 0 && (
                                <span className="text-green-600 font-medium">
                                  {vendor.recent_updates} آیتم جدید در ۲۴ ساعت گذشته
                                </span>
                              )}
                              <span>آخرین به‌روزرسانی: {formatDate(vendor.last_updated)}</span>
                              {vendorStatus === 'updating' && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  در حال به‌روزرسانی
                                </span>
                              )}
                              {vendorStatus === 'completed' && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  تکمیل شد
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Auto-update Toggle */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <Switch
                              checked={vendor.auto_update_enabled}
                              onCheckedChange={(checked) => {
                                toggleVendorAutoUpdate(vendor.vendor_id, checked);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-200">
                        <div className="pt-4">
                          <h4 className="font-medium text-gray-900 mb-3">آیتم‌های رستوران</h4>
                          {loadingVendorItems.has(vendor.vendor_id) ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                              <span className="mr-2 text-gray-600">در حال بارگذاری آیتم‌ها...</span>
                            </div>
                          ) : vendorItems[vendor.vendor_id] ? (
                            <div className="space-y-4">
                              <h4 className="font-medium text-gray-900">آیتم‌های رستوران</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {vendorItems[vendor.vendor_id].slice(0, displayedItemsCount[vendor.vendor_id] || 12).map((item) => (
                                  <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Full width image on top */}
                                    <div className="w-full h-32 bg-gray-100 relative">
                                      {item.image_url && item.image_url.trim() !== '' ? (
                                        <img 
                                          src={item.image_url} 
                                          alt={item.description || item.article_id} 
                                          className="w-full h-full object-cover" 
                                          onError={(e) => {
                                            console.log('Image failed to load:', item.image_url);
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">تصویر موجود نیست</div>';
                                            }
                                          }}
                                          onLoad={() => console.log('Image loaded successfully:', item.image_url)}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                          تصویر موجود نیست
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Compact text and info below */}
                                    <div className="p-3">
                                      <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{item.description}</p>
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                          {item.price && (
                                            <span className="font-medium text-green-600">{item.price} تومان</span>
                                          )}
                                          {item.original_price && item.original_price !== item.price && (
                                            <span className="text-gray-500 line-through">{item.original_price}</span>
                                          )}
                                        </div>
                                        {item.has_discount && (
                                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {item.discount}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Load More Button */}
                              {vendorItems[vendor.vendor_id].length > (displayedItemsCount[vendor.vendor_id] || 12) && (
                                <div className="text-center">
                                  <button
                                    onClick={() => loadMoreItems(vendor.vendor_id)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                                  >
                                    <Plus className="w-4 h-4" />
                                    نمایش ۳۰ آیتم بیشتر
                                  </button>
                                  <p className="text-sm text-gray-600 mt-2">
                                    {vendorItems[vendor.vendor_id].length - (displayedItemsCount[vendor.vendor_id] || 12)} آیتم دیگر موجود است
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p>آیتم‌های رستوران بارگذاری نشده</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}