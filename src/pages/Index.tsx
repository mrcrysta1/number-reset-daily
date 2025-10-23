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
  PhoneNumber,
  getUsedNumbers
} from "@/lib/csvNumberService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NumberRecord {
  id: string;
  number: string;
  used: boolean;
  last_used_at: string | null;
}

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [usedNumbers, setUsedNumbers] = useState<NumberRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const [unusedCount, setUnusedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");

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
      
      setNumbers(convertToNumberRecord(paginatedNumbers));
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

  const fetchUsedNumbers = async (page: number = 1) => {
    setLoading(true);
    try {
      // Get used numbers from used_numbers.csv
      const usedNumbersData = await getUsedNumbers();
      
      // Calculate pagination
      const total = usedNumbersData.length;
      const pages = Math.ceil(total / ITEMS_PER_PAGE);
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedNumbers = usedNumbersData.slice(startIndex, endIndex);
      
      setUsedNumbers(convertToNumberRecord(paginatedNumbers));
      setTotalPages(pages);
      setTotalCount(total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching used numbers:', error);
      toast.error('Failed to load used numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "available") {
      fetchNumbers(1);
    } else {
      fetchUsedNumbers(1);
    }
  }, [activeTab]);

  const handlePageChange = (page: number) => {
    if (activeTab === "available") {
      fetchNumbers(page);
    } else {
      fetchUsedNumbers(page);
    }
  };

  const handleNumberUsed = async (numberId: string) => {
    try {
      const number = numbers.find(n => n.id === numberId);
      if (!number) return;

      await markNumberAsUsed(number.number);
      toast.success('Number marked as used and moved to used_numbers.csv');
      
      // Refresh the current view
      if (activeTab === "available") {
        await fetchNumbers(currentPage);
      } else {
        await fetchUsedNumbers(currentPage);
      }
    } catch (error) {
      console.error('Error marking number as used:', error);
      toast.error('Failed to mark number as used');
    }
  };

  const handleUploadSuccess = () => {
    toast.success('Numbers uploaded successfully!');
    if (activeTab === "available") {
      fetchNumbers(1);
    } else {
      fetchUsedNumbers(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Phone Number Manager
          </h1>
          <p className="text-muted-foreground">Track and manage your phone numbers efficiently</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Numbers</p>
                <p className="text-3xl font-bold">{unusedCount + usedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
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

        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex gap-4 justify-between items-center flex-wrap">
            <UploadNumbers onUploadSuccess={handleUploadSuccess} />
            <ExportNumbers numbers={activeTab === "available" ? numbers : usedNumbers} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">Available Numbers</TabsTrigger>
              <TabsTrigger value="used">Used Numbers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="available" className="mt-6">
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Available Numbers</h2>
                  <span className="text-sm text-muted-foreground">Showing: {totalCount}</span>
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
            </TabsContent>
            
            <TabsContent value="used" className="mt-6">
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Used Numbers</h2>
                  <span className="text-sm text-muted-foreground">Showing: {totalCount}</span>
                </div>
                
                <NumbersTable
                  numbers={usedNumbers}
                  loading={loading}
                  onNumberUsed={handleNumberUsed}
                  hideActions={true}
                />
                
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
