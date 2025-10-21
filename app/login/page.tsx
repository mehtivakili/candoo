'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, Quote } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const router = useRouter();

  // Inspirational quotes for management and income
  const quotes = [
    {
      text: "مدیریت موفق، هنر تبدیل چالش‌ها به فرصت‌هاست",
      author: "پیتر دراکر"
    },
    {
      text: "درآمد بیشتر از طریق تحلیل دقیق و تصمیم‌گیری هوشمند حاصل می‌شود",
      author: "وارن بافت"
    },
    {
      text: "مدیریت مؤثر یعنی استفاده بهینه از منابع برای حداکثر سود",
      author: "جک ولش"
    },
    {
      text: "تحلیل داده‌ها کلید موفقیت در کسب‌وکار مدرن است",
      author: "بیل گیتس"
    },
    {
      text: "مدیریت هوشمند منجر به رشد درآمد و توسعه پایدار می‌شود",
      author: "استیو جابز"
    }
  ];

  // Auto-rotate quotes every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => 
        (prevIndex + 1) % quotes.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('tokenExpiry', data.expiry);
        
        // Redirect to the page they were trying to access or home
        const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
        
        // Use window.location for more reliable redirect
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 100);
      } else {
        setError(data.error || 'خطا در ورود');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto w-56 h-56 mb-6">
              <div className="w-56 h-56 rounded-full overflow-hidden shadow-xl">
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  width={224}
                  height={224}
                  className="w-full h-full object-cover scale-110"
                  priority
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">ورود به سیستم</h1>
            <p className="text-gray-600 text-lg">لطفاً اطلاعات ورود خود را وارد کنید</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  نام کاربری
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-lg transition-all duration-200"
                    placeholder="نام کاربری را وارد کنید"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  رمز عبور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-14 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-lg transition-all duration-200"
                    placeholder="رمز عبور را وارد کنید"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      در حال ورود...
                    </div>
                  ) : (
                    'ورود به سیستم'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Quotes Slideshow */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        {/* Quotes Content */}
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-center text-white max-w-lg">
            <div className="mb-8">
              <Quote className="w-16 h-16 mx-auto mb-6 opacity-80" />
            </div>
            
            <div className="min-h-[200px] flex items-center justify-center">
              <div key={currentQuoteIndex} className="animate-fade-in">
                <blockquote className="text-3xl font-light leading-relaxed mb-8 italic">
                  "{quotes[currentQuoteIndex].text}"
                </blockquote>
                <cite className="text-xl font-medium opacity-90">
                  — {quotes[currentQuoteIndex].author}
                </cite>
              </div>
            </div>

            {/* Quote Indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {quotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuoteIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentQuoteIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white opacity-40 hover:opacity-70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white opacity-5 rounded-full"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-white opacity-5 rounded-full"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-white opacity-5 rounded-full"></div>
      </div>
    </div>
  );
}
