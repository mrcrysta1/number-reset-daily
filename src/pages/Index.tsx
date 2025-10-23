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
  const [usedCount, setUsedCount] = useState(0);
  const [unusedCount, setUnusedCount] = useState(0);
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
      
      // Calculate used and unused counts
      const used = allNumbers.filter(num => num.status === 'used').length;
      const unused = allNumbers.filter(num => num.status === 'available').length;
      setUsedCount(used);
      setUnusedCount(unused);
      
      // Filter only available numbers (hide used numbers)
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
      setCurrentPage(page); // Fix: Update current page state
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

  const handleNumberUsed = async (numberId: string) => {
    try {
      const number = numbers.find(n => n.id === numberId);
      if (!number) return;
      
      await markNumberAsUsed(number.number);
      await fetchNumbers(currentPage);
      toast.success('✅ Number copied! Hidden for 24 hours.');
    } catch (error) {
      console.error('Error marking number as used:', error);
      toast.error('Failed to update number');
    }
  };

  const handleUploadSuccess = () => {
    fetchNumbers(currentPage);
  };

  const handlePageChange = (page: number) => {
    fetchNumbers(page);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Phone className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            Daily Reset Numbers
          </h1>
          <p className="text-muted-foreground">
            Numbers automatically reset every 24 hours
          </p>
        </div>

        {/* Dashboard showing used and unused counts */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Used Numbers</p>
                  <p className="text-3xl font-bold text-red-600">{usedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unused Numbers</p>
                  <p className="text-3xl font-bold text-green-600">{unusedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex gap-4 justify-between items-center flex-wrap">
            <UploadNumbers onUploadSuccess={handleUploadSuccess} />
            <ExportNumbers numbers={numbers} />
          </div>

          <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Available Numbers
              </h2>
              <span className="text-sm text-muted-foreground">
                Showing: {totalCount}
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
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
