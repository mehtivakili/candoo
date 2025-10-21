// Utility functions for Persian date formatting
export const formatPersianDate = (dateString: string): string => {
  try {
    const PersianDate = require('persian-date');
    const date = new Date(dateString);
    const persianDate = new PersianDate(date);
    return persianDate.format('YYYY/MM/DD');
  } catch (error) {
    console.error('Error formatting Persian date:', error);
    return dateString;
  }
};

export const formatPersianDateLong = (dateString: string): string => {
  try {
    const PersianDate = require('persian-date');
    const date = new Date(dateString);
    const persianDate = new PersianDate(date);
    return persianDate.format('dddd، DD MMMM YYYY');
  } catch (error) {
    console.error('Error formatting Persian date:', error);
    return dateString;
  }
};
