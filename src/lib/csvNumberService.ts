// CSV Number Service - Manages phone numbers stored in CSV format
// Handles reading, writing, and daily reset logic

export interface PhoneNumber {
  number: string;
  last_used: string | null;
  status: 'available' | 'used';
}

const CSV_FILE_PATH = '/phone_numbers.csv';

// Parse CSV content to array of phone number objects
export const parseCSV = (csvContent: string): PhoneNumber[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      number: values[0] || '',
      last_used: values[1] || null,
      status: (values[2] || 'available') as 'available' | 'used'
    };
  });
};

// Convert array of phone numbers to CSV format
export const toCSV = (numbers: PhoneNumber[]): string => {
  const header = 'number,last_used,status';
  const rows = numbers.map(num => 
    `${num.number},${num.last_used || ''},${num.status}`
  );
  return [header, ...rows].join('\n');
};

// Fetch all phone numbers from CSV
export const fetchNumbers = async (): Promise<PhoneNumber[]> => {
  try {
    const response = await fetch(CSV_FILE_PATH);
    if (!response.ok) {
      throw new Error('Failed to fetch CSV file');
    }
    const csvContent = await response.text();
    return parseCSV(csvContent);
  } catch (error) {
    console.error('Error fetching numbers:', error);
    return [];
  }
};

// Check if a number needs daily reset (used yesterday or earlier)
export const needsDailyReset = (lastUsed: string | null): boolean => {
  if (!lastUsed) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastUsedDate = new Date(lastUsed);
  lastUsedDate.setHours(0, 0, 0, 0);
  
  return lastUsedDate < today;
};

// Reset numbers that were used before today
export const resetDailyNumbers = (numbers: PhoneNumber[]): PhoneNumber[] => {
  return numbers.map(num => {
    if (needsDailyReset(num.last_used)) {
      return { ...num, status: 'available', last_used: null };
    }
    return num;
  });
};

// Mark a number as used
export const markNumberAsUsed = (numbers: PhoneNumber[], numberToMark: string): PhoneNumber[] => {
  return numbers.map(num => {
    if (num.number === numberToMark) {
      return {
        ...num,
        status: 'used',
        last_used: new Date().toISOString()
      };
    }
    return num;
  });
};

// Get available numbers (after daily reset)
export const getAvailableNumbers = (numbers: PhoneNumber[]): PhoneNumber[] => {
  const resetNumbers = resetDailyNumbers(numbers);
  return resetNumbers.filter(num => num.status === 'available');
};

// Save numbers back to CSV (Note: In a real browser app, this would need a backend)
// This is a placeholder for future backend integration
export const saveNumbers = async (numbers: PhoneNumber[]): Promise<boolean> => {
  try {
    // In a real implementation, this would send the CSV data to a backend endpoint
    // For now, we'll store it in localStorage as a workaround
    const csvContent = toCSV(numbers);
    localStorage.setItem('phone_numbers_csv', csvContent);
    return true;
  } catch (error) {
    console.error('Error saving numbers:', error);
    return false;
  }
};

// Load numbers from localStorage if available (fallback)
export const loadFromLocalStorage = (): PhoneNumber[] | null => {
  try {
    const csvContent = localStorage.getItem('phone_numbers_csv');
    if (csvContent) {
      return parseCSV(csvContent);
    }
    return null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

// Main function to get numbers with daily reset logic
export const getNumbersWithReset = async (): Promise<PhoneNumber[]> => {
  // Try to load from localStorage first (for updates)
  let numbers = loadFromLocalStorage();
  
  // If not in localStorage, fetch from CSV file
  if (!numbers) {
    numbers = await fetchNumbers();
  }
  
  // Apply daily reset logic
  const resetNumbers = resetDailyNumbers(numbers);
  
  // Save back to localStorage
  await saveNumbers(resetNumbers);
  
  return resetNumbers;
};
