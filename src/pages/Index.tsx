import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { NumbersTable } from "@/components/NumbersTable";
import { UploadNumbers } from "@/components/UploadNumbers";
import { ExportNumbers } from "@/components/ExportNumbers";
import { Pagination } from "@/components/Pagination";
import { toast } from "sonner";
import { 
  getNumbersWithReset, 
  markNumberAsUsed, 
  saveNumbers,
  PhoneNumber 
} from "@/lib/csvNumberService";

interface NumberRecord {
  id: string;
  number: string;
  used: boolean;
  last_used_at: string | null;
}

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Convert PhoneNumber to NumberRecord format
  const convertToNumberRecord = (phoneNumbers: PhoneNumber[]): NumberRecord[] => {
    return phoneNumbers.map((num, index) => ({
      id: `${num.number}-${index}`,
      number: num.number,
      used: num.status === 'used',
      last_used_at: num.last_used
    }));
  };

  const fetchNumbers = async (page: number = 1) => {
    setLoading(true);
    try {
      // Get all numbers with daily reset logic applied
      const allNumbers = await getNumbersWithReset();
      
      // Filter only available numbers
      const availableNumbers = allNumbers.filter(num => num.status === 'available');
      
      // Calculate pagination
      const total = availableNumbers.length;
      const pages = Math.ceil(total / ITEMS_PER_PAGE);
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedNumbers = availableNumbers.slice(startIndex, endIndex);
      
      // Convert to NumberRecord format
      const recordNumbers = convertToNumberRecord(paginatedNumbers);
      
      setNumbers(recordNumbers);
      setTotalPages(pages);
      setTotalCount(total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching numbers:', error);
      toast.error('Failed to load numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  const handleNumberUsed = async (number: string) => {
    try {
      // Get all numbers
      const allNumbers = await getNumbersWithReset();
      
      // Mark the number as used
      const updatedNumbers = markNumberAsUsed(allNumbers, number);
      
      // Save back to storage
      await saveNumbers(updatedNumbers);
      
      // Remove number from current display
      setNumbers(prev => prev.filter(n => n.number !== number));
      setTotalCount(prev => prev - 1);
      
      toast.success('✅ Number copied! Hidden for 24 hours.');
    } catch (error) {
      console.error('Error marking number as used:', error);
      toast.error('Failed to update number');
    }
  };

  const handleUploadSuccess = () => {
    fetchNumbers(currentPage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Daily Reset Numbers
          </h1>
          <p className="text-gray-600">
            Numbers automatically reset every 24 hours using CSV storage
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex gap-4 justify-between items-center">
            <UploadNumbers onUploadSuccess={handleUploadSuccess} />
            <ExportNumbers numbers={numbers} />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Available Numbers
              </h2>
              <span className="text-sm text-gray-500">
                Total: {totalCount}
              </span>
            </div>
            
            <NumbersTable
              numbers={numbers}
              loading={loading}
              onNumberUsed={handleNumberUsed}
            />
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={fetchNumbers}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
