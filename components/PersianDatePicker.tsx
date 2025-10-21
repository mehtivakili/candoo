'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import PersianDate from 'persian-date';

interface PersianDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'تاریخ را انتخاب کنید',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(1403);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const persianDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // Convert Gregorian date to Persian
  const gregorianToPersian = (date: Date) => {
    const persianDate = new PersianDate(date);
    return {
      year: persianDate.year(),
      month: persianDate.month(),
      day: persianDate.date()
    };
  };

  // Convert Persian date to Gregorian
  const persianToGregorian = (year: number, month: number, day: number) => {
    const persianDate = new PersianDate([year, month, day]);
    return persianDate.toDate();
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    const persianDate = new PersianDate([year, month, 1]);
    return persianDate.daysInMonth();
  };

  // Get first day of month
  const getFirstDayOfMonth = (year: number, month: number) => {
    const persianDate = new PersianDate([year, month, 1]);
    return persianDate.day();
  };

  // Initialize selected date from value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const persianDate = gregorianToPersian(date);
      setSelectedDate(persianDate);
      setCurrentYear(persianDate.year);
      setCurrentMonth(persianDate.month);
    }
  }, [value]);

  // Handle date selection
  const handleDateSelect = (day: number) => {
    const newSelectedDate = { year: currentYear, month: currentMonth, day };
    setSelectedDate(newSelectedDate);
    
    // Convert to Gregorian and format as YYYY-MM-DD
    const gregorianDate = persianToGregorian(currentYear, currentMonth, day);
    const formattedDate = gregorianDate.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  // Handle month navigation
  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Format display value
  const formatDisplayValue = () => {
    if (selectedDate) {
      return `${selectedDate.year}/${selectedDate.month.toString().padStart(2, '0')}/${selectedDate.day.toString().padStart(2, '0')}`;
    }
    return '';
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        selectedDate.year === currentYear && 
        selectedDate.month === currentMonth && 
        selectedDate.day === day;
      
      const isToday = (() => {
        const today = new PersianDate();
        return today.year() === currentYear && today.month() === currentMonth && today.date() === day;
      })();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isToday
              ? 'bg-blue-100 text-blue-600 font-bold'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      {/* Input Field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 h-10 text-right flex items-center justify-between"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className={formatDisplayValue() ? 'text-gray-800' : 'text-gray-400'}>
          {formatDisplayValue() || placeholder}
        </span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 w-96">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleMonthChange('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2">
              {/* Month Selection */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-500"
              >
                {persianMonths.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              
              {/* Year Selection */}
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-500"
              >
                {(() => {
                  const currentPersianYear = new PersianDate().year();
                  const startYear = currentPersianYear - 10; // 10 years before current
                  const endYear = currentPersianYear + 10; // 10 years after current
                  
                  return Array.from({ length: endYear - startYear + 1 }, (_, i) => {
                    const year = startYear + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  });
                })()}
              </select>
            </div>
            
            <button
              onClick={() => handleMonthChange('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {persianDays.map((day) => (
              <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays()}
          </div>

          {/* Quick actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <button
              onClick={() => {
                const today = new PersianDate();
                setCurrentYear(today.year());
                setCurrentMonth(today.month());
                handleDateSelect(today.date());
              }}
              className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              امروز
            </button>
            <button
              onClick={() => {
                const today = new PersianDate();
                setCurrentYear(today.year());
                setCurrentMonth(today.month());
              }}
              className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              ماه جاری
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersianDatePicker;
