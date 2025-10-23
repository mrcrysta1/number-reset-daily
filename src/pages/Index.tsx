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
