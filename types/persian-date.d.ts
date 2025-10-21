declare module 'persian-date' {
  interface PersianDateOptions {
    year?: number;
    month?: number;
    date?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
  }

  class PersianDate {
    constructor(date?: Date | string | number | PersianDateOptions | PersianDate | [number, number, number]);
    
    year(): number;
    year(year: number): PersianDate;
    
    month(): number;
    month(month: number): PersianDate;
    
    date(): number;
    date(date: number): PersianDate;
    
    hour(): number;
    hour(hour: number): PersianDate;
    
    minute(): number;
    minute(minute: number): PersianDate;
    
    second(): number;
    second(second: number): PersianDate;
    
    millisecond(): number;
    millisecond(millisecond: number): PersianDate;
    
    day(): number;
    
    daysInMonth(): number;
    
    toDate(): Date;
    
    format(formatString: string): string;
    
    add(amount: number, unit: string): PersianDate;
    
    subtract(amount: number, unit: string): PersianDate;
    
    isLeapYear(): boolean;
    
    isValid(): boolean;
  }

  export = PersianDate;
}
