'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Percent, Calendar, Package, Store, BarChart3, Loader2, LineChart, Filter, Save, Trash2, Plus, Database, Trash, RefreshCw, X, BarChart, LogOut } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import PersianDatePicker from '@/components/PersianDatePicker';
import { formatPersianDate } from '@/lib/persian-date-utils';
import * as XLSX from 'xlsx';
import PersianDate from 'persian-date';

interface GeneralStats {
  total_items: string;
  total_vendors: string;
  total_vendor_names: string;
  total_categories: string;
  discounted_items: string;
  avg_price: string;
  min_price: string;
  max_price: string;
  avg_original_price: string;
  total_days: string;
  total_records: string;
}

interface VendorData {
  vendor_name: string;
  item_count: string;
  avg_price: string;
  discounted_count: string;
}

interface CategoryData {
  category: string;
  item_count: string;
  avg_price: string;
  discounted_count: string;
}

interface PriceDistribution {
  price_range: string;
  count: string;
}

interface DiscountData {
  discount: string;
  count: string;
  avg_final_price: string;
  avg_original_price: string;
}

interface RecentItem {
  vendor_name: string;
  category: string;
  item_count: string;
  last_added: string;
}

interface VendorInfo {
  vendor_id: string;
  vendor_name: string;
  item_count: number;
  days_with_data: number;
  avg_price: number;
  categories: string[];
}

interface PriceTrendData {
  date: string;
  avg_price: string;
  avg_original_price?: string;
  items_added: number;
  vendors_added: number;
}

interface ExpensiveItem {
  name: string;
  vendor_name: string;
  category: string;
  price: string;
  discount: string | null;
  original_price?: string;
}

interface StatisticsData {
  general: GeneralStats;
  itemsByVendor: VendorData[];
  itemsByCategory: CategoryData[];
  priceDistribution: PriceDistribution[];
  discountAnalysis: DiscountData[];
  recentAdditions: RecentItem[];
  topExpensive: ExpensiveItem[];
  mostDiscounted: ExpensiveItem[];
  dailyStats: any[];
}

interface PriceTrendData {
  date: string;
  avg_price: string;
  avg_original_price?: string;
  min_price: string;
  max_price: string;
  data_points: string;
  items_count?: string;
  groups_count?: string;
  article_id?: string;
  vendor_name?: string;
  group?: string;
}

interface TrendFilters {
  vendors: string[];
  groups: string[];
  items: string[];
}

interface SavedFilter {
  id: number;
  name: string;
  from_date: string | null;
  to_date: string | null;
  vendor: string | null;
  category: string | null;
  item: string | null;
  created_at: string;
}

interface ComparisonItem {
  vendor_name: string;
  article_id: string;
  price: number;
  original_price: number | null;
  discount: string | null;
  created_at: string;
}

interface ComparisonFilter {
  id: number;
  name: string;
  items: ComparisonItem[];
  created_at: string;
  updated_at: string;
}

export default function StatisticsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  
  // Expanded lists state
  const [expandedExpensive, setExpandedExpensive] = useState<ExpensiveItem[]>([]);
  const [expandedDiscounted, setExpandedDiscounted] = useState<ExpensiveItem[]>([]);
  const [isLoadingExpensive, setIsLoadingExpensive] = useState(false);
  const [isLoadingDiscounted, setIsLoadingDiscounted] = useState(false);
  
  // Pagination state
  const [expensivePage, setExpensivePage] = useState(1);
  const [discountedPage, setDiscountedPage] = useState(1);
  const [hasMoreExpensive, setHasMoreExpensive] = useState(true);
  const [hasMoreDiscounted, setHasMoreDiscounted] = useState(true);
  
  // Price trend states
  const [trendData, setTrendData] = useState<PriceTrendData[]>([]);
  const [trendFilters, setTrendFilters] = useState<TrendFilters>({ vendors: [], groups: [], items: [] });
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  
  // Data generation states
  const [vendorStats, setVendorStats] = useState<VendorInfo[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [generationDays, setGenerationDays] = useState(0);
  const [priceIncreasePercent, setPriceIncreasePercent] = useState(10);
  const [discountPercentage, setDiscountPercentage] = useState(30);
  const [noiseLevel, setNoiseLevel] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showDataGenerator, setShowDataGenerator] = useState(false);
  
  // Filter selections
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedItem, setSelectedItem] = useState('all');
  const [fromDate, setFromDate] = useState(() => {
    // Set to a recent date that should have data (October 2025)
    const date = new Date('2025-10-01');
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    // Set to a date that includes the actual data
    const date = new Date('2025-10-25');
    return date.toISOString().split('T')[0];
  });

  // Dynamic default interval calculation
  const calculateDefaultInterval = (dataRange: number) => {
    if (dataRange <= 7) return 7; // Less than 7 days: show 7 days
    if (dataRange <= 14) return 14; // 1-2 weeks: show 2 weeks
    if (dataRange <= 21) return 21; // 2-3 weeks: show 3 weeks
    return 28; // More than 3 weeks: show 4 weeks
  };
  
  // Saved filters states
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);
  const [isCreatingFilter, setIsCreatingFilter] = useState(false);

  // Comparison states
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [comparisonFilters, setComparisonFilters] = useState<ComparisonFilter[]>([]);
  const [comparisonFilterName, setComparisonFilterName] = useState('');
  const [isSavingComparisonFilter, setIsSavingComparisonFilter] = useState(false);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [showAverageLine, setShowAverageLine] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<number | null>(null);
  
  // Comparison selection states
  const [compSelectedVendor, setCompSelectedVendor] = useState('all');
  const [compSelectedGroup, setCompSelectedGroup] = useState('all');
  const [compSelectedItem, setCompSelectedItem] = useState('all');
  const [compAvailableGroups, setCompAvailableGroups] = useState<string[]>([]);
  const [compAvailableItems, setCompAvailableItems] = useState<string[]>([]);

  useEffect(() => {
    fetchStatistics();
    fetchPriceTrends();
    fetchSavedFilters();
    fetchVendorStats();
    fetchComparisonFilters();
    fetchEarliestDate();
  }, []);

  // Fetch the earliest available date to set proper initial range
  const fetchEarliestDate = async () => {
    try {
      const response = await fetch('/api/price-trends?earliest=true');
      const result = await response.json();
      
      if (result.success && result.earliestDate) {
        const earliestDate = new Date(result.earliestDate);
        const today = new Date();
        
        // Only update dates if current range doesn't include the data
        const currentFromDate = new Date(fromDate);
        const currentToDate = new Date(toDate);
        
        if (earliestDate < currentFromDate || earliestDate > currentToDate) {
          // Use a conservative approach - show last 30 days by default
          const defaultFromDate = new Date();
          defaultFromDate.setDate(defaultFromDate.getDate() - 30);
          
          // Only use earliest date if it's within the last 90 days
          const maxDaysBack = 90;
          const minFromDate = new Date();
          minFromDate.setDate(minFromDate.getDate() - maxDaysBack);
          
          let finalFromDate = defaultFromDate;
          if (earliestDate > minFromDate && earliestDate < today) {
            // Use earliest date if it's recent enough
            finalFromDate = earliestDate;
          }
          
          // Set fromDate to the calculated date
          setFromDate(finalFromDate.toISOString().split('T')[0]);
          
          // Set toDate to today
          setToDate(today.toISOString().split('T')[0]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching earliest date:', error);
    }
  };

  // Auto-adjust date range based on data availability
  useEffect(() => {
    if (trendData.length > 0) {
      const dates = trendData.map(d => new Date(d.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const dataRange = (maxDate - minDate) / (1000 * 60 * 60 * 24); // Days
      
      // Start from the first available data date
      const firstDataDate = new Date(minDate);
      const lastDataDate = new Date(maxDate);
      
      // Calculate suggested range based on data availability
      const suggestedRange = calculateDefaultInterval(dataRange);
      
      // Set fromDate to start from first data or suggested range, whichever is more recent
      const suggestedFromDate = new Date();
      suggestedFromDate.setDate(suggestedFromDate.getDate() - suggestedRange);
      
      // Use the more recent date between first data date and suggested range
      const finalFromDate = firstDataDate > suggestedFromDate ? firstDataDate : suggestedFromDate;
      
      // Only adjust if current range doesn't include the first data point
      const currentFromDate = new Date(fromDate);
      if (currentFromDate > firstDataDate) {
        setFromDate(finalFromDate.toISOString().split('T')[0]);
      }
      
      // Set toDate to the last available data date
      if (new Date(toDate) < lastDataDate) {
        setToDate(lastDataDate.toISOString().split('T')[0]);
      }
    }
  }, [trendData]);

  useEffect(() => {
    fetchStatistics();
    fetchSavedFilters();
    fetchVendorStats();
    fetchComparisonFilters();
    fetchEarliestDate();
  }, []);

  // Fetch price trends after dates are set
  useEffect(() => {
    // Always fetch data, even with empty dates (shows all data)
    fetchPriceTrends();
  }, [fromDate, toDate, selectedVendor, selectedGroup, selectedItem]);

  // Force initial data fetch after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPriceTrends();
    }, 1000); // Wait 1 second after mount

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchComparisonOptions();
  }, [compSelectedVendor, compSelectedGroup]);

  useEffect(() => {
    if (comparisonItems.length > 0) {
      fetchComparisonData();
    }
  }, [comparisonItems.length]); // Only trigger when length changes, not content

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/statistics');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load statistics');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch more expensive items
  const fetchMoreExpensive = async () => {
    try {
      setIsLoadingExpensive(true);
      const response = await fetch(`/api/statistics/expensive?limit=10&offset=${(expensivePage - 1) * 10}`);
      const result = await response.json();

      if (result.success) {
        if (expensivePage === 1) {
          // First page - replace data
          setExpandedExpensive(result.data);
        } else {
          // Subsequent pages - append data
          setExpandedExpensive(prev => [...prev, ...result.data]);
        }
        
        // Check if there's more data
        setHasMoreExpensive(result.data.length === 10);
        setExpensivePage(prev => prev + 1);
      } else {
        console.error('❌ Error fetching more expensive items:', result.error);
      }
    } catch (err: any) {
      console.error('❌ Error fetching more expensive items:', err);
    } finally {
      setIsLoadingExpensive(false);
    }
  };

  // Fetch more discounted items
  const fetchMoreDiscounted = async () => {
    try {
      setIsLoadingDiscounted(true);
      const response = await fetch(`/api/statistics/discounted?limit=10&offset=${(discountedPage - 1) * 10}`);
      const result = await response.json();

      if (result.success) {
        if (discountedPage === 1) {
          // First page - replace data
          setExpandedDiscounted(result.data);
        } else {
          // Subsequent pages - append data
          setExpandedDiscounted(prev => [...prev, ...result.data]);
        }
        
        // Check if there's more data
        setHasMoreDiscounted(result.data.length === 10);
        setDiscountedPage(prev => prev + 1);
      } else {
        console.error('❌ Error fetching more discounted items:', result.error);
      }
    } catch (err: any) {
      console.error('❌ Error fetching more discounted items:', err);
    } finally {
      setIsLoadingDiscounted(false);
    }
  };

  // Export functions
  // Export individual price trend filter
  const exportPriceTrendFilterToExcel = async (filter: SavedFilter) => {
    try {
      // Apply the filter temporarily to get the data
      const originalFromDate = fromDate;
      const originalToDate = toDate;
      const originalSelectedVendor = selectedVendor;
      const originalSelectedGroup = selectedGroup;
      const originalSelectedItem = selectedItem;
      
      // Set filter values
      setFromDate(filter.from_date || '');
      setToDate(filter.to_date || '');
      setSelectedVendor(filter.vendor || 'all');
      setSelectedGroup(filter.category || 'all');
      setSelectedItem(filter.item || 'all');
      
      // Wait a bit for state to update, then fetch data
      setTimeout(async () => {
        try {
          const params = new URLSearchParams();
          if (filter.from_date) params.append('from_date', filter.from_date);
          if (filter.to_date) params.append('to_date', filter.to_date);
          if (filter.vendor && filter.vendor !== 'all') params.append('vendor_name', filter.vendor);
          if (filter.category && filter.category !== 'all') params.append('group', filter.category);
          if (filter.item && filter.item !== 'all') params.append('article_id', filter.item);

          const response = await fetch(`/api/price-trends?${params.toString()}`);
          const result = await response.json();

          if (result.success && result.data.length > 0) {
            // Create filename with current date
            const now = new Date();
            const persianDate = new PersianDate(now);
            const dateStr = persianDate.format('YYYY-MM-DD_HH-mm-ss');
            const filename = `روند_قیمت_${filter.name}_${dateStr}.xlsx`;

            // Prepare data for Excel
            const excelData = [];
            
            // First row: Product info
            excelData.push([
              'نام محصول',
              'دسته‌بندی',
              'فروشنده'
            ]);
            excelData.push([
              filter.item || 'همه محصولات',
              filter.category || 'همه دسته‌ها',
              filter.vendor || 'همه فروشندگان'
            ]);
            
            // Empty row
            excelData.push([]);
            
            // Headers for time series data
            excelData.push([
              'ردیف',
              'تاریخ و زمان',
              'قیمت با تخفیف',
              'قیمت اصلی'
            ]);
            
            // Time series data
            result.data.forEach((item: any, index: number) => {
              const date = new Date(item.date);
              const persianDateTime = new PersianDate(date);
              const formattedDateTime = persianDateTime.format('HH:mm - DD/MM/YYYY');
              
              excelData.push([
                index + 1,
                formattedDateTime,
                item.avg_price,
                item.avg_original_price || item.avg_price
              ]);
            });

            // Create workbook and worksheet
            const ws = XLSX.utils.aoa_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'روند قیمت');

            // Download file
            XLSX.writeFile(wb, filename);
          } else {
            alert('هیچ داده‌ای برای این فیلتر وجود ندارد');
          }
        } catch (error) {
          console.error('❌ Error fetching filter data:', error);
          alert('خطا در دریافت داده‌های فیلتر');
        } finally {
          // Restore original values
          setFromDate(originalFromDate);
          setToDate(originalToDate);
          setSelectedVendor(originalSelectedVendor);
          setSelectedGroup(originalSelectedGroup);
          setSelectedItem(originalSelectedItem);
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error exporting price trend filter:', error);
      alert('خطا در صادرات فایل اکسل');
    }
  };

  const exportPriceTrendsToExcel = async () => {
    try {
      if (!trendData || trendData.length === 0) {
        alert('هیچ داده‌ای برای صادرات وجود ندارد');
        return;
      }

      // Get current filter values for filename
      const vendorName = selectedVendor !== 'all' ? selectedVendor : 'همه فروشندگان';
      const groupName = selectedGroup !== 'all' ? selectedGroup : 'همه دسته‌ها';
      const itemName = selectedItem !== 'all' ? selectedItem : 'همه محصولات';
      
      // Create filename with current date
      const now = new Date();
      const persianDate = new PersianDate(now);
      const dateStr = persianDate.format('YYYY-MM-DD_HH-mm-ss');
      const filename = `روند_قیمت_${itemName}_${groupName}_${vendorName}_${dateStr}.xlsx`;

      // Prepare data for Excel
      const excelData = [];
      
      // First row: Product info
      excelData.push([
        'نام محصول',
        'دسته‌بندی',
        'فروشنده'
      ]);
      excelData.push([
        itemName,
        groupName,
        vendorName
      ]);
      
      // Empty row
      excelData.push([]);
      
      // Headers for time series data
      excelData.push([
        'ردیف',
        'تاریخ و زمان',
        'قیمت با تخفیف',
        'قیمت اصلی'
      ]);
      
      // Time series data
      trendData.forEach((item, index) => {
        const date = new Date(item.date);
        const persianDateTime = new PersianDate(date);
        const formattedDateTime = persianDateTime.format('HH:mm - DD/MM/YYYY');
        
        excelData.push([
          index + 1,
          formattedDateTime,
          item.avg_price,
          item.avg_original_price || item.avg_price
        ]);
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'روند قیمت');

      // Download file
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('❌ Error exporting price trends:', error);
      alert('خطا در صادرات فایل اکسل');
    }
  };

  const exportComparisonToExcel = async (comparison: ComparisonFilter) => {
    try {
      if (!comparison.items || comparison.items.length === 0) {
        alert('هیچ داده‌ای برای صادرات وجود ندارد');
        return;
      }

      // Create filename with current date
      const now = new Date();
      const persianDate = new PersianDate(now);
      const dateStr = persianDate.format('YYYY-MM-DD_HH-mm-ss');
      const filename = `مقایسه_قیمت_${comparison.name}_${dateStr}.xlsx`;

      // Prepare data for Excel
      const excelData = [];
      
      // Headers
      excelData.push([
        'نام محصول',
        'دسته‌بندی',
        'فروشنده',
        'قیمت',
        'قیمت با تخفیف'
      ]);
      
      // Data rows
      comparison.items.forEach((item) => {
        excelData.push([
          item.article_id,
          '', // category - not available in ComparisonItem
          item.vendor_name,
          item.original_price || item.price,
          item.price
        ]);
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'مقایسه قیمت');

      // Download file
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('❌ Error exporting comparison:', error);
      alert('خطا در صادرات فایل اکسل');
    }
  };

  const fetchPriceTrends = async () => {
    try {
      setIsTrendLoading(true);

      const params = new URLSearchParams();
      // Only add date filters if they have values
      if (fromDate && fromDate.trim() !== '') params.append('from_date', fromDate);
      if (toDate && toDate.trim() !== '') params.append('to_date', toDate);
      if (selectedVendor !== 'all') params.append('vendor_name', selectedVendor);
      if (selectedGroup !== 'all') params.append('group', selectedGroup);
      if (selectedItem !== 'all') params.append('article_id', selectedItem);

      const response = await fetch(`/api/price-trends?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // Ensure data is sorted by date in ascending order
        const sortedData = result.data.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setTrendData(sortedData);
        setTrendFilters(result.filters);
        
        // If no data with current filters, try without date filters to see what's available
        if (result.data.length === 0 && (fromDate || toDate)) {
          const noDateParams = new URLSearchParams();
          if (selectedVendor !== 'all') noDateParams.append('vendor_name', selectedVendor);
          if (selectedGroup !== 'all') noDateParams.append('group', selectedGroup);
          if (selectedItem !== 'all') noDateParams.append('article_id', selectedItem);
          
          const noDateResponse = await fetch(`/api/price-trends?${noDateParams.toString()}`);
          const noDateResult = await noDateResponse.json();
        }
      } else {
        console.error('❌ Error fetching price trends:', result.error);
        setTrendData([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching price trends:', err);
      setTrendData([]);
    } finally {
      setIsTrendLoading(false);
    }
  };

  const fetchSavedFilters = async () => {
    try {
      const response = await fetch('/api/menu-filters');
      const result = await response.json();

      if (result.success) {
        setSavedFilters(result.filters);
      }
    } catch (err: any) {
      console.error('Error fetching saved filters:', err);
    }
  };

  // Comparison functions
  const fetchComparisonFilters = async () => {
    try {
      const response = await fetch('/api/comparison-filters');
      const result = await response.json();

      if (result.success) {
        setComparisonFilters(result.filters);
        // Auto-apply first filter if available and no items are currently selected
        if (result.filters.length > 0 && comparisonItems.length === 0) {
          applyComparisonFilter(result.filters[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching comparison filters:', err);
    }
  };

  const fetchComparisonData = async () => {
    try {
      setIsLoadingComparison(true);
      const response = await fetch('/api/comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: comparisonItems })
      });

      const result = await response.json();

      if (result.success) {
        // Update items with actual price data from database
        const updatedItems = comparisonItems.map(item => {
          const dbItem = result.data.find((db: any) => 
            db.vendor_name === item.vendor_name && db.article_id === item.article_id
          );
          return dbItem ? {
            ...item,
            price: parseFloat(dbItem.price),
            original_price: dbItem.original_price ? parseFloat(dbItem.original_price) : null,
            discount: dbItem.discount,
            created_at: dbItem.created_at
          } : item;
        });
        setComparisonItems(updatedItems);
      }
    } catch (err: any) {
      console.error('Error fetching comparison data:', err);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  const fetchComparisonOptions = async () => {
    try {
      const params = new URLSearchParams();
      if (compSelectedVendor !== 'all') params.append('vendor_name', compSelectedVendor);
      if (compSelectedGroup !== 'all') params.append('group', compSelectedGroup);

      const response = await fetch(`/api/comparison?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setCompAvailableGroups(result.filters.groups);
        setCompAvailableItems(result.filters.items);
      }
    } catch (err: any) {
      console.error('Error fetching comparison options:', err);
    }
  };

  const addComparisonItem = () => {
    if (compSelectedVendor === 'all' || compSelectedItem === 'all') {
      return;
    }

    const newItem: ComparisonItem = {
      vendor_name: compSelectedVendor,
      article_id: compSelectedItem,
      price: 0,
      original_price: null,
      discount: null,
      created_at: new Date().toISOString()
    };

    const updatedItems = [...comparisonItems, newItem];
    setComparisonItems(updatedItems);
    setCompSelectedVendor('all');
    setCompSelectedGroup('all');
    setCompSelectedItem('all');
    
    // Auto-save if there's an active filter
    if (activeFilterId) {
      autoSaveActiveFilter(updatedItems);
    }
  };

  const removeComparisonItem = (index: number) => {
    const updatedItems = comparisonItems.filter((_, i) => i !== index);
    setComparisonItems(updatedItems);
    
    // Auto-save if there's an active filter
    if (activeFilterId) {
      autoSaveActiveFilter(updatedItems);
    }
  };

  const saveComparisonFilter = async () => {
    if (!comparisonFilterName.trim() || comparisonItems.length === 0) {
      return;
    }

    setIsSavingComparisonFilter(true);
    try {
      const response = await fetch('/api/comparison-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: comparisonFilterName,
          items: comparisonItems
        })
      });

      const result = await response.json();

      if (result.success) {
        setComparisonFilterName('');
        fetchComparisonFilters();
      } else {
        console.error(`❌ Failed to save comparison filter: ${result.error}`);
      }
    } catch (err: any) {
      console.error('❌ Error saving comparison filter:', err);
    } finally {
      setIsSavingComparisonFilter(false);
    }
  };

  const applyComparisonFilter = (filter: ComparisonFilter) => {
    setComparisonItems(filter.items);
    setComparisonFilterName('');
    setActiveFilterId(filter.id);
  };

  const deleteComparisonFilter = async (id: number) => {
    try {
      const response = await fetch(`/api/comparison-filters?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        fetchComparisonFilters();
        if (activeFilterId === id) {
          setActiveFilterId(null);
        }
      } else {
        console.error(`❌ Failed to delete comparison filter: ${result.error}`);
      }
    } catch (err: any) {
      console.error('❌ Error deleting comparison filter:', err);
    }
  };

  const autoSaveActiveFilter = async (items?: ComparisonItem[]) => {
    const itemsToSave = items || comparisonItems;
    if (activeFilterId && itemsToSave.length > 0) {
      try {
        const response = await fetch('/api/comparison-filters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeFilterId,
            items: itemsToSave
          })
        });

        const result = await response.json();
        if (result.success) {
          fetchComparisonFilters();
        }
      } catch (err: any) {
        console.error('❌ Error auto-saving filter:', err);
      }
    }
  };

  // Data generation functions
  const fetchVendorStats = async () => {
    try {
      const response = await fetch('/api/data-generator');
      const result = await response.json();

      if (result.success) {
        setVendorStats(result.vendors);
      }
    } catch (err: any) {
      console.error('Error fetching vendor stats:', err);
    }
  };

  const generateHistoricalData = async () => {
    if (selectedVendors.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/data-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          options: {
            vendorIds: selectedVendors,
            days: generationDays,
            priceIncreasePercent,
            discountPercentage,
            noiseLevel
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh all data
        await fetchStatistics();
        await fetchVendorStats();
        await fetchPriceTrends();
      } else {
        console.error(`❌ Data generation failed: ${result.message}`);
      }
    } catch (err: any) {
      console.error('❌ Error generating data:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const cleanAllData = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید تمام داده‌ها را پاک کنید؟ این عمل قابل بازگشت نیست.')) {
      return;
    }

    setIsCleaning(true);
    try {
      const response = await fetch('/api/data-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanAll' })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh all data
        await fetchStatistics();
        await fetchVendorStats();
        await fetchPriceTrends();
      } else {
        console.error(`❌ Clean all data failed: ${result.message}`);
      }
    } catch (err: any) {
      console.error('❌ Error cleaning data:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const cleanTimelineData = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید داده‌های تاریخی را پاک کنید و فقط آخرین رکورد هر محصول را نگه دارید؟')) {
      return;
    }

    setIsCleaning(true);
    try {
      const response = await fetch('/api/data-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanTimeline' })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh all data
        await fetchStatistics();
        await fetchVendorStats();
        await fetchPriceTrends();
      } else {
        console.error(`❌ Clean timeline data failed: ${result.message}`);
      }
    } catch (err: any) {
      console.error('❌ Error cleaning timeline data:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const saveCurrentFilter = async () => {
    if (!filterName.trim()) {
      alert('لطفاً نام فیلتر را وارد کنید');
      return;
    }

    try {
      setIsSavingFilter(true);

      const response = await fetch('/api/menu-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: filterName,
          from_date: fromDate,
          to_date: toDate,
          vendor: selectedVendor,
          category: selectedGroup,
          item: selectedItem
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setFilterName('');
        setIsCreatingFilter(false);
        fetchSavedFilters();
      } else {
        alert(`خطا: ${result.error}`);
      }
    } catch (err: any) {
      console.error('Error saving filter:', err);
      alert('خطا در ذخیره فیلتر');
    } finally {
      setIsSavingFilter(false);
    }
  };

  const applySavedFilter = (filter: SavedFilter) => {
    if (filter.from_date) setFromDate(filter.from_date);
    if (filter.to_date) setToDate(filter.to_date);
    setSelectedVendor(filter.vendor || 'all');
    setSelectedGroup(filter.category || 'all');
    setSelectedItem(filter.item || 'all');
  };

  const deleteSavedFilter = async (id: number) => {
    if (!confirm('آیا از حذف این فیلتر اطمینان دارید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/menu-filters?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchSavedFilters();
      } else {
        alert(`خطا: ${result.error}`);
      }
    } catch (err: any) {
      console.error('Error deleting filter:', err);
      alert('خطا در حذف فیلتر');
    }
  };

  const formatNumber = (num: string | number) => {
    return Math.round(Number(num)).toLocaleString('fa-IR');
  };

  const formatPrice = (price: string | number) => {
    return Math.round(Number(price)).toLocaleString('fa-IR') + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">در حال بارگذاری آمار...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 text-lg font-semibold mb-2">خطا در بارگذاری آمار</p>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchStatistics}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">بررسی آمار پایگاه داده</h1>
                <p className="text-gray-600 mt-1">تحلیل و آمار پایگاه داده</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Navigation Button */}
              <Link
                href="/vendor_management"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                مدیریت جمع‌آوری داده
              </Link>
              
              <button
                onClick={fetchStatistics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>بروزرسانی</span>
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Generation Controls */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Database className="w-5 h-5" />
              مدیریت داده‌ها
            </h2>
            <button
              onClick={() => setShowDataGenerator(!showDataGenerator)}
              className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${
                showDataGenerator 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {showDataGenerator ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {showDataGenerator ? 'بستن' : 'تولید داده جعلی'}
            </button>
          </div>

          {showDataGenerator && (
            <div className="space-y-6">
              {/* Vendor Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">انتخاب رستوران‌ها</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedVendors(vendorStats.map(v => v.vendor_id))}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      انتخاب همه
                    </button>
                    {selectedVendors.length > 0 && (
                      <button
                        onClick={() => setSelectedVendors([])}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        انتخاب هیچ‌کدام
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {vendorStats.map((vendor) => (
                    <label key={vendor.vendor_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.vendor_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVendors([...selectedVendors, vendor.vendor_id]);
                          } else {
                            setSelectedVendors(selectedVendors.filter(id => id !== vendor.vendor_id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{vendor.vendor_name}</div>
                        <div className="text-sm text-gray-600">
                          {vendor.item_count} آیتم • {vendor.days_with_data} روز داده
                        </div>
                        <div className="text-xs text-gray-500">
                          میانگین قیمت: {formatNumber(vendor.avg_price)} تومان
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generation Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تعداد روزها ({generationDays} روز)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={generationDays}
                    onChange={(e) => setGenerationDays(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 روز</span>
                    <span>1 ماه</span>
                    <span>2 ماه</span>
                    <span>3 ماه</span>
                    <span>4 ماه</span>
                    <span>5 ماه</span>
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={generationDays}
                      onChange={(e) => setGenerationDays(Math.max(0, Math.min(150, parseInt(e.target.value) || 0)))}
                      className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="تعداد روزها را وارد کنید"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    درصد افزایش قیمت ({priceIncreasePercent}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={priceIncreasePercent}
                    onChange={(e) => setPriceIncreasePercent(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    درصد تخفیف ({discountPercentage}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سطح نویز ({noiseLevel}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={noiseLevel}
                    onChange={(e) => setNoiseLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={generateHistoricalData}
                  disabled={isGenerating || selectedVendors.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  {isGenerating ? 'در حال تولید...' : 'تولید داده تاریخی'}
                </button>

                <button
                  onClick={cleanTimelineData}
                  disabled={isCleaning}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCleaning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isCleaning ? 'در حال پاک کردن...' : 'پاک کردن داده‌های تاریخی'}
                </button>

                <button
                  onClick={cleanAllData}
                  disabled={isCleaning}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCleaning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash className="w-4 h-4" />
                  )}
                  {isCleaning ? 'در حال پاک کردن...' : 'پاک کردن تمام داده‌ها'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-800">
                {formatNumber(data.general.total_items)}
              </span>
            </div>
            <p className="text-gray-600 font-medium">کل محصولات</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-800">
                {formatNumber(data.general.total_vendors)}
              </span>
            </div>
            <p className="text-gray-600 font-medium">کل رستوران‌ها</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-800">
                {formatNumber(data.general.total_categories)}
              </span>
            </div>
            <p className="text-gray-600 font-medium">دسته‌بندی‌ها</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-gray-800">
                {formatNumber(data.general.discounted_items)}
              </span>
            </div>
            <p className="text-gray-600 font-medium">محصولات تخفیف‌دار</p>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <span className="text-3xl font-bold text-gray-800">
                {formatNumber(data.general.total_days)}
              </span>
            </div>
            <p className="text-gray-600 font-medium">کل روزهای داده</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-orange-600" />
              <span className="text-3xl font-bold text-gray-800">
                {formatNumber(data.general.total_records)}
              </span>
            </div>
            <p className="text-gray-600 font-medium">کل رکوردهای داده</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-teal-600" />
              <span className="text-3xl font-bold text-gray-800">
                {data.general.total_records && data.general.total_days ? 
                  formatNumber(Math.round(Number(data.general.total_records) / Number(data.general.total_days))) : '0'}
              </span>
            </div>
            <p className="text-gray-600 font-medium">میانگین رکورد در روز</p>
          </div>
        </div>

        {/* Price Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm opacity-90 mb-1">میانگین قیمت</p>
            <p className="text-2xl font-bold">{formatPrice(data.general.avg_price)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm opacity-90 mb-1">کمترین قیمت</p>
            <p className="text-2xl font-bold">{formatPrice(data.general.min_price)}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm opacity-90 mb-1">بیشترین قیمت</p>
            <p className="text-2xl font-bold">{formatPrice(data.general.max_price)}</p>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Items by Vendor */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              محصولات بر اساس رستوران
            </h2>
            <div className="w-full">
              <div className="w-full">
                <div className="grid grid-cols-3 gap-4 bg-gray-50 py-3 px-3 rounded-t-lg border-b-2 border-gray-300">
                  <div className="text-right font-bold text-gray-800">رستوران</div>
                  <div className="text-center font-bold text-gray-800">تعداد</div>
                  <div className="text-right font-bold text-gray-800">میانگین قیمت</div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {data.itemsByVendor.map((vendor, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 py-3 px-3 border-b hover:bg-blue-50 transition-colors">
                      <div className="text-right text-gray-800 font-medium truncate" title={vendor.vendor_name}>{vendor.vendor_name}</div>
                      <div className="text-center font-bold text-blue-700">{formatNumber(vendor.item_count)}</div>
                      <div className="text-right text-green-700 font-semibold">{formatPrice(vendor.avg_price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Items by Category */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              محصولات بر اساس دسته‌بندی
            </h2>
            <div className="w-full">
              <div className="w-full">
                <div className="grid grid-cols-3 gap-4 bg-gray-50 py-3 px-3 rounded-t-lg border-b-2 border-gray-300">
                  <div className="text-right font-bold text-gray-800">دسته‌بندی</div>
                  <div className="text-center font-bold text-gray-800">تعداد</div>
                  <div className="text-right font-bold text-gray-800">میانگین قیمت</div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {data.itemsByCategory.map((category, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 py-3 px-3 border-b hover:bg-purple-50 transition-colors">
                      <div className="text-right text-gray-800 font-medium truncate" title={category.category}>{category.category}</div>
                      <div className="text-center font-bold text-purple-700">{formatNumber(category.item_count)}</div>
                      <div className="text-right text-green-700 font-semibold">{formatPrice(category.avg_price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            توزیع قیمت
          </h2>
          <div className="flex items-end justify-around gap-4 h-80 px-4">
            {data.priceDistribution.map((range, idx) => {
              const count = Number(range.count);
              const maxCount = Math.max(...data.priceDistribution.map(r => Number(r.count)));
              const heightPercentage = (count / maxCount) * 100;
              const colors = [
                'from-blue-400 to-blue-600',
                'from-green-400 to-green-600',
                'from-yellow-400 to-yellow-600',
                'from-orange-400 to-orange-600',
                'from-red-400 to-red-600'
              ];
              
              return (
                <div key={idx} className="flex flex-col items-center flex-1 gap-2">
                  {/* Bar */}
                  <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '240px' }}>
                    <div
                      className={`w-full bg-gradient-to-t ${colors[idx]} rounded-t-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer relative group`}
                      style={{ height: `${heightPercentage}%`, minHeight: '30px' }}
                    >
                      {/* Value on top of bar */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatNumber(count)} محصول
                      </div>
                      {/* Percentage inside bar */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-lg drop-shadow-lg">
                          {count}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-800">{range.price_range}</div>
                    <div className="text-xs text-gray-600 font-medium">
                      {((count / Number(data.general.total_items)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Trends Over Time */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-blue-600" />
              تغییرات قیمت در طول زمان
            </h2>
            <Filter className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex gap-6">
            {/* Main Chart Area (Left Side - 70%) */}
            <div className="flex-1">
              {/* Filters */}
              <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                {/* Date From */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                  <PersianDatePicker
                    value={fromDate}
                    onChange={setFromDate}
                    placeholder="از تاریخ را انتخاب کنید"
                    className="w-full"
                  />
                </div>

                {/* Date To */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                  <PersianDatePicker
                    value={toDate}
                    onChange={setToDate}
                    placeholder="تا تاریخ را انتخاب کنید"
                    className="w-full"
                  />
                </div>


                {/* Vendor */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">رستوران</label>
                  <select
                    value={selectedVendor}
                    onChange={(e) => {
                      setSelectedVendor(e.target.value);
                      setSelectedGroup('all');
                      setSelectedItem('all');
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 bg-white h-10"
                  >
                    <option value="all">همه رستوران‌ها</option>
                    {trendFilters.vendors.map((vendor) => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </select>
                </div>

                {/* Group/Category */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                      setSelectedItem('all');
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 bg-white h-10"
                  >
                    <option value="all">همه دسته‌ها (میانگین)</option>
                    {trendFilters.groups.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                {/* Item */}
                <div className="flex flex-col col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">محصول</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    disabled={selectedVendor === 'all'}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                  >
                    <option value="all">
                      {selectedGroup === 'all' ? 'همه محصولات (میانگین)' : 'میانگین دسته'}
                    </option>
                    {trendFilters.items.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

          {/* Chart */}
          {isTrendLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">در حال بارگذاری داده‌ها...</p>
                <p className="text-sm text-gray-500 mt-1">
                  محدوده: {formatPersianDate(fromDate)} تا {formatPersianDate(toDate)}
                </p>
              </div>
            </div>
          ) : trendData.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-lg mb-2">داده‌ای برای فیلترهای انتخاب شده موجود نیست</p>
                <p className="text-sm text-gray-400 mb-4">
                  محدوده تاریخ: {formatPersianDate(fromDate)} تا {formatPersianDate(toDate)}
                </p>
                <button
                  onClick={() => fetchPriceTrends()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Simple Line Chart using CSS */}
              <div className="relative h-96 border-2 border-gray-200 rounded-lg p-6 bg-gradient-to-br from-white to-gray-50">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between py-6 pr-2 text-right">
                  {(() => {
                    const finalPrices = trendData.map(d => Number(d.avg_price));
                    const originalPrices = trendData.map(d => Number(d.avg_original_price || d.avg_price));
                    const allPrices = [...finalPrices, ...originalPrices];
                    const maxPrice = Math.max(...allPrices);
                    const minPrice = Math.min(...allPrices);
                    
                    // Improve scaling for small variations
                    const range = maxPrice - minPrice;
                    const padding = range * 0.1; // 10% padding
                    const adjustedMin = Math.max(0, minPrice - padding);
                    const adjustedMax = maxPrice + padding;
                    const step = (adjustedMax - adjustedMin) / 5;
                    
                    return [5, 4, 3, 2, 1, 0].map((i) => (
                      <span key={i} className="text-xs text-gray-600 font-medium">
                        {formatNumber(Math.round((adjustedMin + step * i) / 1000))}K
                      </span>
                    ));
                  })()}
                </div>

                {/* Chart Area */}
                <div className="ml-20 mr-4 h-full relative">
                  <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <line
                        key={`grid-${i}`}
                        x1="0"
                        y1={(i / 5) * 400}
                        x2="1000"
                        y2={(i / 5) * 400}
                        stroke="#e5e7eb"
                        strokeWidth="2"
                        strokeDasharray="8,4"
                      />
                    ))}

                    {(() => {
                      const finalPrices = trendData.map(d => Number(d.avg_price));
                      const originalPrices = trendData.map(d => Number(d.avg_original_price || d.avg_price));
                      const allPrices = [...finalPrices, ...originalPrices];
                      const maxPrice = Math.max(...allPrices);
                      const minPrice = Math.min(...allPrices);
                      
                      // Improve scaling for small variations
                      const range = maxPrice - minPrice;
                      const padding = range * 0.1; // 10% padding
                      const adjustedMin = Math.max(0, minPrice - padding);
                      const adjustedMax = maxPrice + padding;
                      const adjustedRange = adjustedMax - adjustedMin || 1;
                      
                      // Sort data by date to ensure continuous line
                      const sortedData = [...trendData].sort((a, b) => 
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                      );
                      
                      // Calculate date range for proper X positioning
                      const dates = sortedData.map(d => new Date(d.date).getTime());
                      const minDate = Math.min(...dates);
                      const maxDate = Math.max(...dates);
                      const dateRange = maxDate - minDate || 1;
                      
                      // Helper function to create segments
                      const createSegments = (dataArray: any[], priceField: string) => {
                        const segments: string[][] = [];
                        let currentSegment: string[] = [];
                        
                        dataArray.forEach((point, idx) => {
                          const currentDate = new Date(point.date).getTime();
                          const x = ((currentDate - minDate) / dateRange) * 1000;
                          const priceValue = Number(point[priceField] || point.avg_price);
                          const y = 400 - (((priceValue - adjustedMin) / adjustedRange) * 400);
                          
                          // Check if there's a gap from previous point
                          if (idx > 0) {
                            const prevDate = new Date(dataArray[idx - 1].date).getTime();
                            const daysDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
                            
                            if (daysDiff > 2) {
                              if (currentSegment.length > 0) {
                                segments.push([...currentSegment]);
                              }
                              currentSegment = [];
                            }
                          }
                          
                          currentSegment.push(`${x},${y}`);
                        });
                        
                        if (currentSegment.length > 0) {
                          segments.push(currentSegment);
                        }
                        
                        return segments;
                      };
                      
                      const finalPriceSegments = createSegments(sortedData, 'avg_price');
                      const originalPriceSegments = createSegments(sortedData, 'avg_original_price');
                      
                      // Check if we have any discounted items
                      const hasDiscounts = sortedData.some(d => d.avg_original_price && Number(d.avg_original_price) !== Number(d.avg_price));
                      
                      return (
                        <>
                          {/* Original Price Line (gray) - if discounts exist */}
                          {hasDiscounts && originalPriceSegments.map((segment, segIdx) => (
                            <polyline
                              key={`original-${segIdx}`}
                              points={segment.join(' ')}
                              fill="none"
                              stroke="#9ca3af"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray="5,5"
                            />
                          ))}
                          
                          {/* Final Price Line (blue) - Connected dots only */}
                          {finalPriceSegments.map((segment, segIdx) => (
                            <g key={`final-${segIdx}`}>
                              {/* Draw connecting lines */}
                              <polyline
                                points={segment.join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {/* Draw dots at each point */}
                              {segment.map((point, pointIdx) => {
                                const [x, y] = point.split(',').map(Number);
                                return (
                                  <circle
                                    key={`final-dot-${segIdx}-${pointIdx}`}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#3b82f6"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="hover:r-6 cursor-pointer transition-all"
                                  />
                                );
                              })}
                            </g>
                          ))}
                          
                          {/* Original Price Line (gray) - Connected dots only */}
                          {hasDiscounts && originalPriceSegments.map((segment, segIdx) => (
                            <g key={`original-${segIdx}`}>
                              {/* Draw connecting lines */}
                              <polyline
                                points={segment.join(' ')}
                                fill="none"
                                stroke="#9ca3af"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="5,5"
                              />
                              {/* Draw dots at each point */}
                              {segment.map((point, pointIdx) => {
                                const [x, y] = point.split(',').map(Number);
                                return (
                                  <circle
                                    key={`original-dot-${segIdx}-${pointIdx}`}
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill="#9ca3af"
                                    stroke="white"
                                    strokeWidth="1"
                                    className="hover:r-5 cursor-pointer transition-all"
                                  />
                                );
                              })}
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* X-axis labels (dates) */}
                <div className="ml-20 mr-4 mt-2 flex justify-between text-xs text-gray-600" dir="ltr">
                  {trendData.length > 0 && (() => {
                    // Data is already sorted in fetchPriceTrends, but ensure it's correct
                    const sortedData = [...trendData].sort((a, b) => 
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                    );
                    
                    const firstDate = formatPersianDate(sortedData[0].date);
                    const middleDate = sortedData.length > 2 ? formatPersianDate(sortedData[Math.floor(sortedData.length / 2)].date) : '';
                    const lastDate = formatPersianDate(sortedData[sortedData.length - 1].date);
                    
                    return (
                      <>
                        <span>{firstDate}</span>
                        {sortedData.length > 2 && (
                          <span>{middleDate}</span>
                        )}
                        <span>{lastDate}</span>
                      </>
                    );
                  })()}
                </div>

              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-700 font-medium mb-1">میانگین قیمت</p>
                  <p className="text-lg font-bold text-green-800">
                    {(() => {
                      if (trendData.length === 0) return formatPrice(0);
                      // Calculate average of daily averages (mean of means)
                      const dailyAverages = trendData.map(d => Number(d.avg_price));
                      const mean = dailyAverages.reduce((sum, price) => sum + price, 0) / dailyAverages.length;
                      return formatPrice(Math.round(mean));
                    })()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-1">کمترین قیمت</p>
                  <p className="text-lg font-bold text-blue-800">
                    {trendData.length > 0 ? formatPrice(Math.min(...trendData.map(d => Number(d.min_price)))) : formatPrice(0)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-700 font-medium mb-1">بیشترین قیمت</p>
                  <p className="text-lg font-bold text-red-800">
                    {trendData.length > 0 ? formatPrice(Math.max(...trendData.map(d => Number(d.max_price)))) : formatPrice(0)}
                  </p>
                </div>
              </div>
            </div>
          )}
            </div>

            {/* Right Sidebar - Saved Filters (30%) */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200 sticky top-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Save className="w-5 h-5 text-blue-600" />
                  فیلترهای ذخیره شده
                </h3>

                {/* Add New Filter Button */}
                {!isCreatingFilter && (
                  <div className="mb-4 text-center">
                    <button
                      onClick={() => setIsCreatingFilter(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      افزودن فیلتر جدید
                    </button>
                  </div>
                )}

                {/* Filter Creation Form */}
                {isCreatingFilter && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-blue-300">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">نام فیلتر</label>
                      <button
                        onClick={() => {
                          setIsCreatingFilter(false);
                          setFilterName('');
                        }}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        لغو
                      </button>
                    </div>
                    <input
                      type="text"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="نام فیلتر را وارد کنید..."
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 mb-2"
                    />
                    <button
                      onClick={saveCurrentFilter}
                      disabled={isSavingFilter || !filterName.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                      {isSavingFilter ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      اضافه کردن
                    </button>
                  </div>
                )}

                {/* Saved Filters List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-2">فیلترهای از پیش تعریف شده:</p>
                  {savedFilters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>فیلتری ذخیره نشده است</p>
                    </div>
                  ) : (
                    savedFilters.map((filter) => (
                      <div
                        key={filter.id}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => applySavedFilter(filter)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-blue-600">
                              {filter.name}
                            </h4>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              {filter.from_date && <p>از: {formatPersianDate(filter.from_date)}</p>}
                              {filter.to_date && <p>تا: {formatPersianDate(filter.to_date)}</p>}
                              {filter.vendor && <p>رستوران: {filter.vendor}</p>}
                              {filter.category && <p>دسته: {filter.category}</p>}
                              {filter.item && <p>محصول: {filter.item}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportPriceTrendFilterToExcel(filter);
                              }}
                              className="text-green-600 hover:text-green-800 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="دانلود اکسل"
                            >
                              <Database className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSavedFilter(filter.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="حذف فیلتر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Item Comparison Section - Moved below price trends */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart className="w-6 h-6 text-purple-600" />
            مقایسه قیمت محصولات
          </h2>

          {/* Chart Section - Full Width */}
          <div className="space-y-6">
            {/* Chart Section - Full Width */}
            <div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-blue-600" />
                    نمودار مقایسه قیمت
                  </h3>
                  {comparisonItems.length > 0 && (
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAverageLine}
                        onChange={(e) => setShowAverageLine(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                      <span>نمایش خط میانگین</span>
                    </label>
                  )}
                </div>

                {comparisonItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">محصولی برای مقایسه انتخاب نشده</p>
                    <p className="text-sm mt-2">برای شروع، محصولات مورد نظر را از پایین اضافه کنید</p>
                  </div>
                ) : isLoadingComparison ? (
                  <div className="text-center py-12 text-gray-500">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-spin" />
                    <p className="text-lg">در حال بارگذاری داده‌ها...</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Professional Chart using same style as price trends */}
                    <div className="relative h-[500px] border-2 border-gray-200 rounded-lg p-6 pb-20 bg-gradient-to-br from-white to-gray-50">
                      {/* Chart Area with Y-axis labels */}
                      <div className="relative h-[350px] mb-4">
                        {/* Y-axis labels - K format (0 to max) */}
                        <div className="absolute left-0 top-0 w-20 h-full flex flex-col justify-between pr-2 text-right">
                          {(() => {
                            const maxPrice = Math.max(...comparisonItems.map(i => i.price));
                            const topValue = maxPrice * 1.1; // 10% MORE than highest amount
                            const step = topValue / 5;
                            return [5, 4, 3, 2, 1, 0].map((i) => (
                              <span key={i} className="text-xs text-gray-600 font-medium">
                                {formatNumber(Math.round((step * i) / 1000))}K
                              </span>
                            ));
                          })()}
                        </div>

                        {/* Chart Area */}
                        <div className="ml-20 mr-4 h-full relative">
                        <svg className="w-full h-full" viewBox="0 0 1100 400" preserveAspectRatio="none">
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <line
                              key={`grid-${i}`}
                              x1="0"
                              y1={(i / 5) * 400}
                              x2="1000"
                              y2={(i / 5) * 400}
                              stroke="#e5e7eb"
                              strokeWidth="2"
                              strokeDasharray="8,4"
                            />
                          ))}

                          {/* Data points as bars */}
                          {comparisonItems.map((item, index) => {
                            const maxPrice = Math.max(...comparisonItems.map(i => i.price));
                            const topValue = maxPrice * 1.1;
                            const minPrice = 0;
                            const range = topValue - minPrice;
                            
                            // Calculate bar dimensions with left margin and narrower bars
                            const leftMargin = 50; // Add 50px left margin
                            const availableWidth = 1000 - leftMargin; // Available width after margin
                            const barWidth = availableWidth / comparisonItems.length;
                            const barHeight = ((item.price - minPrice) / range) * 400;
                            const x = leftMargin + (index * barWidth) + (barWidth * 0.15); // Add margin and center bar
                            const y = 400 - barHeight; // Start from bottom (zero baseline)
                            
                            return (
                              <g key={index}>
                                <rect
                                  x={x}
                                  y={y}
                                  width={barWidth * 0.6} // 60% of allocated space (narrower bars)
                                  height={barHeight}
                                  fill="#3b82f6"
                                  stroke="white"
                                  strokeWidth="2"
                                  rx="4"
                                  className="hover:fill-blue-600 cursor-pointer transition-all"
                                >
                                  <title>{`${item.article_id} - ${item.vendor_name}: ${formatPrice(item.price)}`}</title>
                                </rect>
                                {/* Price label on top of bar */}
                                <text
                                  x={x + (barWidth * 0.6) / 2}
                                  y={y - 8}
                                  textAnchor="middle"
                                  className="text-xs font-bold fill-gray-800"
                                  style={{ fontSize: '10px' }}
                                >
                                  {formatNumber(Math.round(item.price / 1000))}K
                                </text>
                              </g>
                            );
                          })}

                          {/* Average line */}
                          {showAverageLine && comparisonItems.length > 0 && (() => {
                            const maxPrice = Math.max(...comparisonItems.map(i => i.price));
                            const topValue = maxPrice * 1.1;
                            const minPrice = 0;
                            const range = topValue - minPrice;
                            const averagePrice = comparisonItems.reduce((sum, item) => sum + item.price, 0) / comparisonItems.length;
                            const averageY = 400 - (((averagePrice - minPrice) / range) * 400);
                            const leftMargin = 50;
                            const availableWidth = 1000 - leftMargin;
                            
                            return (
                              <line
                                x1={leftMargin}
                                y1={averageY}
                                x2={1000}
                                y2={averageY}
                                stroke="#dc2626"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                opacity="0.8"
                              >
                                <title>{`میانگین قیمت: ${formatPrice(averagePrice)}`}</title>
                              </line>
                            );
                          })()}
                        </svg>
                        </div>
                      </div>

                      {/* X-axis labels (item names) */}
                      <div className="ml-20 mr-4" style={{ position: 'relative', height: '120px', paddingTop: '8px' }}>
                        {comparisonItems.map((item, index) => {
                          const leftMargin = 50; // Match the bar margin
                          const availableWidth = 1000 - leftMargin;
                          const barWidth = availableWidth / comparisonItems.length;
                          const centerPosition = leftMargin + (index * barWidth) + (barWidth / 2);
                          
                          // Truncate text to max 15 characters
                          const truncateText = (text: string, maxLength: number = 15) => {
                            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
                          };
                          
                          return (
                            <div 
                              key={index} 
                              className="text-xs text-gray-600"
                              style={{ 
                                position: 'absolute',
                                left: `${(centerPosition / 1100) * 100}%`, // Convert to percentage based on viewBox
                                transform: 'translateX(-50%) rotate(-45deg)',
                                transformOrigin: 'center',
                                width: `${(barWidth * 0.6 / 1100) * 100}%`,
                                textAlign: 'center',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <p className="font-medium text-gray-800" title={item.article_id}>
                                {truncateText(item.article_id)}
                              </p>
                              <p className="text-gray-600 mt-1" title={item.vendor_name}>
                                {truncateText(item.vendor_name)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Selection Section - Below Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
            {/* Item Selection - 30% wider */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  انتخاب محصول
                </h3>

                {/* Vendor Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">رستوران</label>
                  <select
                    value={compSelectedVendor}
                    onChange={(e) => {
                      setCompSelectedVendor(e.target.value);
                      setCompSelectedGroup('all');
                      setCompSelectedItem('all');
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 bg-white h-10"
                  >
                    <option value="all">همه رستوران‌ها</option>
                    {trendFilters.vendors.map((vendor) => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </select>
                </div>

                {/* Group Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی</label>
                  <select
                    value={compSelectedGroup}
                    onChange={(e) => {
                      setCompSelectedGroup(e.target.value);
                      setCompSelectedItem('all');
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 bg-white h-10"
                  >
                    <option value="all">همه دسته‌بندی‌ها</option>
                    {compAvailableGroups.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                {/* Item Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">محصول</label>
                  <select
                    value={compSelectedItem}
                    onChange={(e) => setCompSelectedItem(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 bg-white h-10"
                  >
                    <option value="all">همه محصولات</option>
                    {compAvailableItems.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={addComparisonItem}
                  disabled={compSelectedVendor === 'all' || compSelectedItem === 'all'}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  افزودن به مقایسه
                </button>
              </div>
            </div>

            {/* Selected Items - 4 columns with less width */}
            <div className="lg:col-span-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                <h4 className="text-md font-semibold text-gray-700 mb-3">محصولات انتخاب شده ({comparisonItems.length})</h4>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                  {comparisonItems.length === 0 ? (
                    <div className="w-full text-center py-4 text-gray-500 text-sm">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>محصولی انتخاب نشده</p>
                    </div>
                  ) : (
                    comparisonItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 min-w-0 max-w-full">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-medium text-gray-800 text-xs break-words" title={item.article_id}>{item.article_id}</p>
                          <p className="text-xs text-gray-600 break-words" title={item.vendor_name}>{item.vendor_name}</p>
                          <p className="text-xs font-bold text-blue-600">{formatPrice(item.price)}</p>
                        </div>
                        <button
                          onClick={() => removeComparisonItem(index)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Save Filter Section - 30% wider */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border-2 border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-700">ذخیره فیلتر</h4>
                  <button
                    onClick={() => {
                      setComparisonFilterName('');
                      setComparisonItems([]);
                      setActiveFilterId(null);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    افزودن فیلتر جدید
                  </button>
                </div>
                {comparisonItems.length > 0 ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={comparisonFilterName}
                      onChange={(e) => setComparisonFilterName(e.target.value)}
                      placeholder="نام فیلتر"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 text-sm"
                    />
                    <button
                      onClick={saveComparisonFilter}
                      disabled={isSavingComparisonFilter || !comparisonFilterName.trim()}
                      className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {isSavingComparisonFilter ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSavingComparisonFilter ? 'ذخیره...' : 'ذخیره'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">ابتدا محصولی اضافه کنید</p>
                )}

                {/* Saved Comparison Filters - Moved here */}
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Filter className="w-4 h-4 ml-1" />
                    فیلترهای ذخیره شده
                  </h5>
                  
                  {comparisonFilters.length === 0 ? (
                    <p className="text-xs text-gray-500">هیچ فیلتری ذخیره نشده</p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {comparisonFilters.map((filter) => (
                        <div 
                          key={filter.id} 
                          className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                            activeFilterId === filter.id 
                              ? 'bg-blue-100 border-blue-400 shadow-md' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => applyComparisonFilter(filter)}
                          >
                            <span className={`text-xs truncate ${
                              activeFilterId === filter.id ? 'text-blue-800 font-semibold' : 'text-gray-700'
                            }`}>
                              {filter.name}
                            </span>
                            <span className={`text-xs block ${
                              activeFilterId === filter.id ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              ({filter.items.length} آیتم)
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportComparisonToExcel(filter);
                              }}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="دانلود اکسل"
                            >
                              <Database className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteComparisonFilter(filter.id);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="حذف فیلتر"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Top Expensive & Most Discounted */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Expensive */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              گران‌ترین محصولات
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(expandedExpensive.length > 0 ? expandedExpensive : data.topExpensive.slice(0, 5)).map((item, idx) => (
                <div key={idx} className="border-b-2 border-gray-200 pb-3 last:border-0 hover:bg-red-50 p-2 rounded transition-colors">
                  <p className="font-bold text-gray-900 text-base">{item.name}</p>
                  <p className="text-sm text-gray-700 font-medium mt-1">{item.vendor_name}</p>
                  <p className="text-xl font-bold text-red-700 mt-2">
                    {formatPrice(item.price)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Show More Button for Expensive Items */}
            {hasMoreExpensive && (
              <div className="mt-4 text-center">
                <button
                  onClick={fetchMoreExpensive}
                  disabled={isLoadingExpensive}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isLoadingExpensive ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال بارگذاری...
                    </>
                  ) : (
                    'نمایش بیشتر'
                  )}
                </button>
              </div>
            )}
            
            {/* Reset Button for Expensive Items */}
            {expandedExpensive.length > 0 && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => {
                    setExpandedExpensive([]);
                    setExpensivePage(1);
                    setHasMoreExpensive(true);
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  نمایش کمتر
                </button>
              </div>
            )}
          </div>

          {/* Most Discounted */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-600" />
              بیشترین تخفیف‌ها
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(expandedDiscounted.length > 0 ? expandedDiscounted : data.mostDiscounted.slice(0, 5)).map((item, idx) => (
                <div key={idx} className="border-b-2 border-gray-200 pb-3 last:border-0 hover:bg-green-50 p-2 rounded transition-colors">
                  <p className="font-bold text-gray-900 text-base">{item.name}</p>
                  <p className="text-sm text-gray-700 font-medium mt-1">{item.vendor_name}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-base text-gray-600 line-through font-medium">
                      {item.original_price ? formatPrice(item.original_price) : ''}
                    </span>
                    <span className="text-xl font-bold text-green-700">
                      {formatPrice(item.price)}
                    </span>
                    {item.discount && (
                      <span className="text-sm bg-red-600 text-white px-3 py-1 rounded-full font-bold">
                        {item.discount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Show More Button for Discounted Items */}
            {hasMoreDiscounted && (
              <div className="mt-4 text-center">
                <button
                  onClick={fetchMoreDiscounted}
                  disabled={isLoadingDiscounted}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isLoadingDiscounted ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال بارگذاری...
                    </>
                  ) : (
                    'نمایش بیشتر'
                  )}
                </button>
              </div>
            )}
            
            {/* Reset Button for Discounted Items */}
            {expandedDiscounted.length > 0 && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => {
                    setExpandedDiscounted([]);
                    setDiscountedPage(1);
                    setHasMoreDiscounted(true);
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  نمایش کمتر
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </ProtectedRoute>
  );
}
