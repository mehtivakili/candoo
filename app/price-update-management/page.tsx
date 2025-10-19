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
  ChevronUp as ChevronUpIcon
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import './styles.css';

interface VendorItem {
  id: number;
  article_id: string;
  vendor_id: string;
  vendor_name: string;
  group: string;
  price: number | null;
  original_price: number | null;
  discount: string | null;
  item_count: number;
  description: string | null;
  image_url: string | null;
  has_discount: boolean;
  created_at: string;
  updated_at: string;
}

interface Vendor {
  vendor_id: string;
  vendor_name: string;
  last_update: string | null;
  total_items: number;
  status: 'active' | 'inactive' | 'error';
  auto_update_enabled: boolean;
  update_frequency: 'daily' | 'weekly' | 'monthly';
  priority: 'high' | 'medium' | 'low';
}

interface SchedulerConfig {
  enabled: boolean;
  days: string[]; // ['monday', 'tuesday', etc.]
  hour: number;
  minute: number;
  maxVendorsPerRun: number;
  delayBetweenVendors: number;
}

interface UpdateSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalVendors: number;
  successfulVendors: number;
  failedVendors: number;
  totalItemsUpdated: number;
  status: 'running' | 'completed' | 'failed';
  currentVendor?: string;
}

export default function PriceUpdateManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [config, setConfig] = useState<SchedulerConfig>({
    enabled: false,
    days: [],
    hour: 6,
    minute: 0,
    maxVendorsPerRun: 50,
    delayBetweenVendors: 5000
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

  const daysOfWeek = [
    { key: 'monday', label: 'دوشنبه', short: 'دو' },
    { key: 'tuesday', label: 'سه‌شنبه', short: 'سه' },
    { key: 'wednesday', label: 'چهارشنبه', short: 'چهار' },
    { key: 'thursday', label: 'پنج‌شنبه', short: 'پنج' },
    { key: 'friday', label: 'جمعه', short: 'جم' },
    { key: 'saturday', label: 'شنبه', short: 'شن' },
    { key: 'sunday', label: 'یکشنبه', short: 'یک' }
  ];

  useEffect(() => {
    loadVendors();
    loadConfig();
    loadSessionStatus();
    
    // Cleanup any stuck updating vendors on page load
    setUpdatingVendors(new Set());
    setCompletedVendors(new Set());
  }, []);

  // Poll for session updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession?.status === 'running') {
      interval = setInterval(() => {
        loadSessionStatus();
        loadVendors(); // Refresh vendor status
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession?.status]);

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
      if (data.success) {
        const session = data.session;
        setCurrentSession(session);
        
        // Handle session completion
        if (session?.status === 'completed') {
          // Clear updating vendors and mark completed ones
          if (session.results) {
            const completedVendorIds = session.results
              .filter(result => result.success)
              .map(result => result.vendorId);
            
            setCompletedVendors(new Set(completedVendorIds));
            setUpdatingVendors(new Set());
            
            // Refresh vendor data to show updated information
            await loadVendors();
          } else {
            // If no results, just clear updating vendors
            setUpdatingVendors(new Set());
            // Still refresh vendor data
            await loadVendors();
          }
          
          // Clear session immediately to stop polling
          setCurrentSession(null);
          
          // Clear completion status after showing it briefly
          setTimeout(() => {
            setCompletedVendors(new Set());
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const updateConfig = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/price-update/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
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
              .filter(result => result.success)
              .map(result => result.vendorId);
            
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
    setUpdatingVendors(prev => new Set([...prev, vendorId]));
    await triggerManualUpdate([vendorId]);
  };

  const updateAllVendors = async () => {
    await triggerManualUpdate();
  };

  const updateSelectedVendors = async () => {
    if (selectedVendors.length === 0) {
      setError('لطفاً حداقل یک رستوران انتخاب کنید');
      return;
    }
    await triggerManualUpdate(selectedVendors);
  };

  const toggleVendorAutoUpdate = async (vendorId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/price-update/vendor-toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, enabled }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setVendors(prev => prev.map(vendor => 
          vendor.vendor_id === vendorId 
            ? { ...vendor, auto_update_enabled: enabled }
            : vendor
        ));
        setSuccess(`Auto-update ${enabled ? 'فعال' : 'غیرفعال'} شد`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('خطا در تغییر وضعیت auto-update');
    }
  };

  const toggleVendorExpansion = async (vendorId: string) => {
    const isExpanded = expandedVendors.has(vendorId);
    
    if (isExpanded) {
      // Collapse
      setExpandedVendors(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    } else {
      // Expand - load vendor items if not already loaded
      setExpandedVendors(prev => new Set([...prev, vendorId]));
      
      if (!vendorItems[vendorId]) {
        await loadVendorItems(vendorId);
      }
    }
  };

  const loadVendorItems = async (vendorId: string) => {
    setLoadingVendorItems(prev => new Set([...prev, vendorId]));
    
    try {
      // Encode the vendor ID to handle special characters in URLs
      const encodedVendorId = encodeURIComponent(vendorId);
      console.log('Loading items for vendor:', vendorId, 'encoded:', encodedVendorId);
      
      const response = await fetch(`/api/price-update/vendor-items/${encodedVendorId}`);
      const data = await response.json();
      
      if (data.success) {
        setVendorItems(prev => ({
          ...prev,
          [vendorId]: data.items
        }));
        console.log(`Loaded ${data.items.length} items for vendor ${vendorId}`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error loading vendor items:', err);
      setError('خطا در بارگذاری آیتم‌های رستوران');
    } finally {
      setLoadingVendorItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید تمام داده‌های این رستوران را حذف کنید؟')) {
      return;
    }

    try {
      // Encode the vendor ID to handle special characters in URLs
      const encodedVendorId = encodeURIComponent(vendorId);
      console.log('Deleting vendor:', vendorId, 'encoded:', encodedVendorId);
      
      const response = await fetch(`/api/price-update/vendor/${encodedVendorId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('رستوران با موفقیت حذف شد');
        // Remove from vendors list
        setVendors(prev => prev.filter(vendor => vendor.vendor_id !== vendorId));
        // Remove from expanded vendors
        setExpandedVendors(prev => {
          const newSet = new Set(prev);
          newSet.delete(vendorId);
          return newSet;
        });
        // Remove vendor items
        setVendorItems(prev => {
          const newItems = { ...prev };
          delete newItems[vendorId];
          return newItems;
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setError('خطا در حذف رستوران');
    }
  };

  const toggleDay = (day: string) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const adjustTime = (type: 'hour' | 'minute', direction: 'up' | 'down') => {
    setConfig(prev => {
      const current = type === 'hour' ? prev.hour : prev.minute;
      const max = type === 'hour' ? 23 : 59;
      const min = 0;
      
      let newValue = current;
      if (direction === 'up') {
        newValue = current >= max ? min : current + 1;
      } else {
        newValue = current <= min ? max : current - 1;
      }
      
      return {
        ...prev,
        [type]: newValue
      };
    });
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'هرگز';
    return new Date(dateString).toLocaleString('fa-IR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'inactive': return 'غیرفعال';
      case 'error': return 'خطا';
      default: return 'نامشخص';
    }
  };

  const getVendorStatus = (vendorId: string) => {
    if (updatingVendors.has(vendorId)) return 'updating';
    if (completedVendors.has(vendorId)) return 'completed';
    return 'idle';
  };

  const clearStuckStatuses = () => {
    setUpdatingVendors(new Set());
    setCompletedVendors(new Set());
    setCurrentSession(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                مدیریت به‌روزرسانی قیمت‌ها
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                سیستم خودکار به‌روزرسانی قیمت‌های منوهای رستوران‌ها
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">{vendors.length} رستوران</span>
              </div>
              <button
                onClick={loadVendors}
                className="p-2 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Current Session Status */}
        {currentSession && (
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                وضعیت جلسه فعلی
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{currentSession.totalVendors}</div>
                  <div className="text-sm text-gray-600">کل رستوران‌ها</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{currentSession.successfulVendors}</div>
                  <div className="text-sm text-gray-600">موفق</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{currentSession.failedVendors}</div>
                  <div className="text-sm text-gray-600">ناموفق</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{currentSession.totalItemsUpdated}</div>
                  <div className="text-sm text-gray-600">آیتم به‌روزرسانی شده</div>
                </div>
              </div>
              
              {currentSession.status === 'running' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-medium">در حال پردازش...</span>
                    {currentSession.currentVendor && (
                      <span className="text-sm">({currentSession.currentVendor})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
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
                        className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                          config.days.includes(day.key)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">زمان به‌روزرسانی</h3>
                  <div className="flex items-center justify-center gap-4">
                    {/* Hour */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => adjustTime('hour', 'up')}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <div className="px-4 py-2 bg-gray-50 rounded-lg font-mono text-lg font-bold min-w-[60px] text-center text-gray-900">
                        {config.hour.toString().padStart(2, '0')}
                      </div>
                      <button
                        onClick={() => adjustTime('hour', 'down')}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-2xl font-bold text-gray-400">:</div>

                    {/* Minute */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => adjustTime('minute', 'up')}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <div className="px-4 py-2 bg-gray-50 rounded-lg font-mono text-lg font-bold min-w-[60px] text-center text-gray-900">
                        {config.minute.toString().padStart(2, '0')}
                      </div>
                      <button
                        onClick={() => adjustTime('minute', 'down')}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Manual Time Input */}
                  <div className="mt-3">
                    <input
                      type="time"
                      value={formatTime(config.hour, config.minute)}
                      onChange={(e) => {
                        const [hour, minute] = e.target.value.split(':').map(Number);
                        setConfig(prev => ({ ...prev, hour, minute }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      حداکثر رستوران در هر اجرا
                    </label>
                    <input
                      type="number"
                      value={config.maxVendorsPerRun}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxVendorsPerRun: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاخیر بین رستوران‌ها (ثانیه)
                    </label>
                    <input
                      type="number"
                      value={config.delayBetweenVendors / 1000}
                      onChange={(e) => setConfig(prev => ({ ...prev, delayBetweenVendors: parseInt(e.target.value) * 1000 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={updateConfig}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Settings className="w-5 h-5" />
                  )}
                  ذخیره تنظیمات
                </button>
              </div>
            </div>
          </div>

          {/* Vendors List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    لیست رستوران‌ها
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={updateSelectedVendors}
                      disabled={isLoading || selectedVendors.length === 0}
                      className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <Play className="w-4 h-4" />
                      به‌روزرسانی انتخاب شده
                    </button>
                    <button
                      onClick={updateAllVendors}
                      disabled={isLoading}
                      className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <Zap className="w-4 h-4" />
                      همه رستوران‌ها
                    </button>
                    <button
                      onClick={clearStuckStatuses}
                      className="px-4 py-2 bg-red-500/20 text-white rounded-lg hover:bg-red-500/30 flex items-center gap-2 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      پاک کردن وضعیت
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {vendors.map((vendor) => {
                    const vendorStatus = getVendorStatus(vendor.vendor_id);
                    const isExpanded = expandedVendors.has(vendor.vendor_id);
                    const isLoadingItems = loadingVendorItems.has(vendor.vendor_id);
                    const items = vendorItems[vendor.vendor_id] || [];
                    
                    return (
                      <div key={vendor.vendor_id}>
                        {/* Main Vendor Card */}
                        <div
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => toggleVendorExpansion(vendor.vendor_id)}
                        >
                          <div className="flex items-center gap-4">
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
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-3">
                              {/* Status Icon */}
                              {vendorStatus === 'updating' && (
                                <RotateCcw className="w-5 h-5 text-blue-600 animate-spin" />
                              )}
                              {vendorStatus === 'completed' && (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                              {vendorStatus === 'idle' && (
                                <div className="w-5 h-5" />
                              )}
                              
                              <div>
                                <h3 className="font-medium text-gray-900">{vendor.vendor_name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="text-gray-900">{vendor.total_items} آیتم</span>
                                  <span className="text-gray-900">آخرین به‌روزرسانی: {formatDate(vendor.last_update)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                                    {getStatusText(vendor.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Auto-update Toggle */}
                            <Switch
                              checked={vendor.auto_update_enabled}
                              onCheckedChange={(checked) => {
                                toggleVendorAutoUpdate(vendor.vendor_id, checked);
                              }}
                              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                            />
                            
                            {/* Update Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateVendor(vendor.vendor_id);
                              }}
                              disabled={isLoading || vendorStatus === 'updating'}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                            >
                              {vendorStatus === 'updating' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              به‌روزرسانی
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteVendor(vendor.vendor_id);
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </button>

                            {/* Expand/Collapse Icon */}
                            {isExpanded ? (
                              <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Vendor Items */}
                        {isExpanded && (
                          <div className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4">
                              <h4 className="font-medium text-gray-900 mb-4">آیتم‌های منو</h4>
                              
                              {isLoadingItems ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                  <span className="mr-2 text-gray-600">در حال بارگذاری...</span>
                                </div>
                              ) : items.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-right text-gray-700">نام آیتم</th>
                                        <th className="px-4 py-2 text-right text-gray-700">دسته‌بندی</th>
                                        <th className="px-4 py-2 text-right text-gray-700">قیمت</th>
                                        <th className="px-4 py-2 text-right text-gray-700">قیمت اصلی</th>
                                        <th className="px-4 py-2 text-right text-gray-700">تخفیف</th>
                                        <th className="px-4 py-2 text-right text-gray-700">آخرین به‌روزرسانی</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {items.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                          <td className="px-4 py-2 text-gray-900">{item.article_id}</td>
                                          <td className="px-4 py-2 text-gray-600">{item.group}</td>
                                          <td className="px-4 py-2 text-gray-900 font-medium">
                                            {item.price ? `${item.price.toLocaleString('fa-IR')} تومان` : 'نامشخص'}
                                          </td>
                                          <td className="px-4 py-2 text-gray-600">
                                            {item.original_price ? `${item.original_price.toLocaleString('fa-IR')} تومان` : '-'}
                                          </td>
                                          <td className="px-4 py-2">
                                            {item.has_discount ? (
                                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                {item.discount || 'تخفیف'}
                                              </span>
                                            ) : (
                                              <span className="text-gray-400">-</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-gray-600 text-xs">
                                            {formatDate(item.updated_at)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  آیتمی یافت نشد
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