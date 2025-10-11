'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Percent, Calendar, Package, Store, BarChart3, Loader2, LineChart, Filter, Save, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

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

interface ExpensiveItem {
  name: string;
  vendor_name: string;
  category: string;
  price: string;
  discount: string | null;
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

export default function StatisticsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Price trend states
  const [trendData, setTrendData] = useState<PriceTrendData[]>([]);
  const [trendFilters, setTrendFilters] = useState<TrendFilters>({ vendors: [], groups: [], items: [] });
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  
  // Filter selections
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedItem, setSelectedItem] = useState('all');
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 60); // Default to 60 days ago
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Saved filters states
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);

  useEffect(() => {
    fetchStatistics();
    fetchPriceTrends();
    fetchSavedFilters();
  }, []);

  useEffect(() => {
    fetchPriceTrends();
  }, [selectedVendor, selectedGroup, selectedItem, fromDate, toDate]);

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

  const fetchPriceTrends = async () => {
    try {
      setIsTrendLoading(true);

      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (selectedVendor !== 'all') params.append('vendor_name', selectedVendor);
      if (selectedGroup !== 'all') params.append('group', selectedGroup);
      if (selectedItem !== 'all') params.append('article_id', selectedItem);

      const response = await fetch(`/api/price-trends?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setTrendData(result.data);
        setTrendFilters(result.filters);
      }
    } catch (err: any) {
      console.error('Error fetching price trends:', err);
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
    return Number(num).toLocaleString('fa-IR');
  };

  const formatPrice = (price: string | number) => {
    return Number(price).toLocaleString('fa-IR') + ' تومان';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">بررسی آمار پایگاه داده</h1>
                <p className="text-gray-600 mt-1">تحلیل و آمار پایگاه داده</p>
              </div>
            </div>
            <button
              onClick={fetchStatistics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>بروزرسانی</span>
            </button>
          </div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-right py-3 px-3 font-bold text-gray-800">رستوران</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-800">تعداد</th>
                    <th className="text-right py-3 px-3 font-bold text-gray-800">میانگین قیمت</th>
                  </tr>
                </thead>
                <tbody>
                  {data.itemsByVendor.slice(0, 10).map((vendor, idx) => (
                    <tr key={idx} className="border-b hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-3 text-right text-gray-800 font-medium">{vendor.vendor_name}</td>
                      <td className="py-3 px-3 text-center font-bold text-blue-700">
                        {formatNumber(vendor.item_count)}
                      </td>
                      <td className="py-3 px-3 text-right text-green-700 font-semibold">
                        {formatPrice(vendor.avg_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Items by Category */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              محصولات بر اساس دسته‌بندی
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-right py-3 px-3 font-bold text-gray-800">دسته‌بندی</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-800">تعداد</th>
                    <th className="text-right py-3 px-3 font-bold text-gray-800">میانگین قیمت</th>
                  </tr>
                </thead>
                <tbody>
                  {data.itemsByCategory.slice(0, 10).map((category, idx) => (
                    <tr key={idx} className="border-b hover:bg-purple-50 transition-colors">
                      <td className="py-3 px-3 text-right text-gray-800 font-medium">{category.category}</td>
                      <td className="py-3 px-3 text-center font-bold text-purple-700">
                        {formatNumber(category.item_count)}
                      </td>
                      <td className="py-3 px-3 text-right text-green-700 font-semibold">
                        {formatPrice(category.avg_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 h-10"
                  />
                </div>

                {/* Date To */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 h-10"
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : trendData.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>داده‌ای برای فیلترهای انتخاب شده موجود نیست</p>
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
                    const step = (maxPrice - minPrice) / 5;
                    return [5, 4, 3, 2, 1, 0].map((i) => (
                      <span key={i} className="text-xs text-gray-600 font-medium">
                        {formatNumber(Math.round((minPrice + step * i) / 1000))}K
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
                      const range = maxPrice - minPrice || 1;
                      
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
                          const y = 400 - (((priceValue - minPrice) / range) * 400);
                          
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
                          
                          {/* Final Price Line (blue) */}
                          {finalPriceSegments.map((segment, segIdx) => (
                            <polyline
                              key={`final-${segIdx}`}
                              points={segment.join(' ')}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ))}
                          
                          {/* Data points */}
                          {sortedData.map((point, idx) => {
                            const currentDate = new Date(point.date).getTime();
                            const x = ((currentDate - minDate) / dateRange) * 1000;
                            
                            const finalPrice = Number(point.avg_price);
                            const originalPrice = Number(point.avg_original_price || point.avg_price);
                            
                            const finalY = 400 - (((finalPrice - minPrice) / range) * 400);
                            const originalY = 400 - (((originalPrice - minPrice) / range) * 400);
                            
                            return (
                              <g key={idx}>
                                {/* Original price point (if different from final) */}
                                {hasDiscounts && originalPrice !== finalPrice && (
                                  <circle
                                    cx={x}
                                    cy={originalY}
                                    r="4"
                                    fill="#9ca3af"
                                    stroke="white"
                                    strokeWidth="2"
                                  >
                                    <title>{`${new Date(point.date).toLocaleDateString('fa-IR')}: قیمت اصلی ${formatPrice(originalPrice)}`}</title>
                                  </circle>
                                )}
                                
                                {/* Final price point */}
                                <circle
                                  cx={x}
                                  cy={finalY}
                                  r="6"
                                  fill="#3b82f6"
                                  stroke="white"
                                  strokeWidth="2"
                                  className="hover:r-8 cursor-pointer transition-all"
                                >
                                  <title>{`${new Date(point.date).toLocaleDateString('fa-IR')}: ${formatPrice(finalPrice)}${originalPrice !== finalPrice ? ` (قیمت اصلی: ${formatPrice(originalPrice)})` : ''}`}</title>
                                </circle>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* X-axis labels (dates) */}
                <div className="ml-20 mr-4 mt-2 flex justify-between text-xs text-gray-600">
                  {trendData.length > 0 && (() => {
                    const sortedData = [...trendData].sort((a, b) => 
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                    );
                    return (
                      <>
                        <span>{new Date(sortedData[0].date).toLocaleDateString('fa-IR')}</span>
                        {sortedData.length > 2 && (
                          <span>{new Date(sortedData[Math.floor(sortedData.length / 2)].date).toLocaleDateString('fa-IR')}</span>
                        )}
                        <span>{new Date(sortedData[sortedData.length - 1].date).toLocaleDateString('fa-IR')}</span>
                      </>
                    );
                  })()}
                </div>

                {/* Legend */}
                {trendData.some(d => d.avg_original_price && Number(d.avg_original_price) !== Number(d.avg_price)) && (
                  <div className="flex items-center justify-center gap-6 mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-blue-600"></div>
                      <span className="text-sm text-gray-700 font-medium">قیمت نهایی</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-gray-400 border-dashed border-t-2 border-gray-400"></div>
                      <span className="text-sm text-gray-700 font-medium">قیمت اصلی</span>
                    </div>
                  </div>
                )}
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

                {/* Save Current Filter */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-blue-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">نام فیلتر</label>
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
                      <Plus className="w-4 h-4" />
                    )}
                    اضافه کردن
                  </button>
                </div>

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
                              {filter.from_date && <p>از: {new Date(filter.from_date).toLocaleDateString('fa-IR')}</p>}
                              {filter.to_date && <p>تا: {new Date(filter.to_date).toLocaleDateString('fa-IR')}</p>}
                              {filter.vendor && <p>رستوران: {filter.vendor}</p>}
                              {filter.category && <p>دسته: {filter.category}</p>}
                              {filter.item && <p>محصول: {filter.item}</p>}
                            </div>
                          </div>
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
                    ))
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
            <div className="space-y-3">
              {data.topExpensive.slice(0, 5).map((item, idx) => (
                <div key={idx} className="border-b-2 border-gray-200 pb-3 last:border-0 hover:bg-red-50 p-2 rounded transition-colors">
                  <p className="font-bold text-gray-900 text-base">{item.name}</p>
                  <p className="text-sm text-gray-700 font-medium mt-1">{item.vendor_name}</p>
                  <p className="text-xl font-bold text-red-700 mt-2">
                    {formatPrice(item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Most Discounted */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-600" />
              بیشترین تخفیف‌ها
            </h2>
            <div className="space-y-3">
              {data.mostDiscounted.slice(0, 5).map((item, idx) => (
                <div key={idx} className="border-b-2 border-gray-200 pb-3 last:border-0 hover:bg-green-50 p-2 rounded transition-colors">
                  <p className="font-bold text-gray-900 text-base">{item.name}</p>
                  <p className="text-sm text-gray-700 font-medium mt-1">{item.vendor_name}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-base text-gray-600 line-through font-medium">
                      {formatPrice(item.original_price)}
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
          </div>
        </div>
      </div>
    </div>
  );
}

