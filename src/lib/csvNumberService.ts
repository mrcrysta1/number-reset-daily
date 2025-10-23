// CSV Number Service - Manages phone numbers stored in CSV format
// Handles reading, writing, and daily reset logic with separate used_numbers.csv file

export interface PhoneNumber {
  number: string;
  last_used: string | null;
  status: 'available' | 'used';
}

const CSV_FILE_PATH = '/phone_numbers.csv';
const USED_CSV_FILE_PATH = '/used_numbers.csv';

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

// Fetch used numbers from used_numbers.csv
export const fetchUsedNumbers = async (): Promise<PhoneNumber[]> => {
  try {
    const response = await fetch(USED_CSV_FILE_PATH);
    if (!response.ok) {
      // If file doesn't exist, return empty array
      return [];
    }
    const csvContent = await response.text();
    return parseCSV(csvContent);
  } catch (error) {
    console.error('Error fetching used numbers:', error);
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

// Save used numbers to used_numbers.csv in localStorage
export const saveUsedNumbers = async (usedNumbers: PhoneNumber[]): Promise<boolean> => {
  try {
    const csvContent = toCSV(usedNumbers);
    localStorage.setItem('used_numbers_csv', csvContent);
    return true;
  } catch (error) {
    console.error('Error saving used numbers:', error);
    return false;
  }
};

// Load used numbers from localStorage
export const loadUsedFromLocalStorage = (): PhoneNumber[] | null => {
  try {
    const csvContent = localStorage.getItem('used_numbers_csv');
    if (csvContent) {
      return parseCSV(csvContent);
    }
    return null;
  } catch (error) {
    console.error('Error loading used numbers from localStorage:', error);
    return null;
  }
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

// Mark a number as used and move it to used_numbers.csv
export const markNumberAsUsed = async (numberToMark: string): Promise<void> => {
  try {
    // Load used numbers from localStorage
    let usedNumbers = loadUsedFromLocalStorage();
    if (!usedNumbers) {
      usedNumbers = await fetchUsedNumbers();
    }
    
    // Add the new used number with current timestamp
    const newUsedNumber: PhoneNumber = {
      number: numberToMark,
      status: 'used',
      last_used: new Date().toISOString()
    };
    
    // Check if number already exists in used list
    const existingIndex = usedNumbers.findIndex(n => n.number === numberToMark);
    if (existingIndex >= 0) {
      // Update existing entry
      usedNumbers[existingIndex] = newUsedNumber;
    } else {
      // Add new entry
      usedNumbers.push(newUsedNumber);
    }
    
    // Apply daily reset to used numbers before saving
    const resetUsedNumbers = resetDailyNumbers(usedNumbers);
    
    // Save back to localStorage
    await saveUsedNumbers(resetUsedNumbers);
  } catch (error) {
    console.error('Error marking number as used:', error);
    throw error;
  }
};

// Main function to get numbers with daily reset logic
export const getNumbersWithReset = async (): Promise<PhoneNumber[]> => {
  try {
    // Fetch all available numbers from phone_numbers.csv
    let allNumbers = loadFromLocalStorage();
    if (!allNumbers) {
      allNumbers = await fetchNumbers();
    }
    
    // Fetch used numbers from used_numbers.csv
    let usedNumbers = loadUsedFromLocalStorage();
    if (!usedNumbers) {
      usedNumbers = await fetchUsedNumbers();
    }
    
    // Apply daily reset to used numbers
    const resetUsedNumbers = resetDailyNumbers(usedNumbers);
    
    // Save reset used numbers back
    await saveUsedNumbers(resetUsedNumbers);
    
    // Create a set of currently used numbers (after reset)
    const usedNumbersSet = new Set(
      resetUsedNumbers
        .filter(n => n.status === 'used')
        .map(n => n.number)
    );
    
    // Mark numbers in allNumbers based on used_numbers.csv
    const mergedNumbers = allNumbers.map(num => {
      if (usedNumbersSet.has(num.number)) {
        const usedNum = resetUsedNumbers.find(n => n.number === num.number);
        return {
          ...num,
          status: 'used' as const,
          last_used: usedNum?.last_used || num.last_used
        };
      }
      return {
        ...num,
        status: 'available' as const
      };
    });
    
    return mergedNumbers;
  } catch (error) {
    console.error('Error in getNumbersWithReset:', error);
    throw error;
  }
};
