import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { NumbersTable } from "@/components/NumbersTable";
import { UploadNumbers } from "@/components/UploadNumbers";
import { ExportNumbers } from "@/components/ExportNumbers";
import { Pagination } from "@/components/Pagination";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NumberRecord {
  id: string;
  number: string;
  used: boolean;
  last_used_at: string | null;
}

const Index = () => {
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNumbers = async (page: number = 1) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-numbers', {
        body: { page },
      });

      if (error) throw error;

      setNumbers(data.numbers);
      setTotalPages(data.totalPages);
      setTotalCount(data.total);
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
      const { error } = await supabase.functions.invoke('use-number', {
        body: { number },
      });

      if (error) throw error;

      // Remove number from list
      setNumbers(prev => prev.filter(n => n.number !== number));
      setTotalCount(prev => prev - 1);

      toast.success('✅ Number copied! Hidden for 24 hours.');
    } catch (error) {
      console.error('Error marking number as used:', error);
      toast.error('Failed to mark number as used');
    }
  };

  const handlePageChange = (page: number) => {
    fetchNumbers(page);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Number Manager</h1>
                <p className="text-sm text-muted-foreground">
                  24-hour number rotation system
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <UploadNumbers onUploadComplete={() => fetchNumbers(1)} />
              <ExportNumbers />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 transition-all hover:shadow-lg">
            <p className="text-sm font-medium text-muted-foreground">Available Numbers</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{totalCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 transition-all hover:shadow-lg">
            <p className="text-sm font-medium text-muted-foreground">Current Page</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{currentPage}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 transition-all hover:shadow-lg">
            <p className="text-sm font-medium text-muted-foreground">Reset Time</p>
            <p className="mt-2 text-xl font-bold text-accent">5:00 AM PKT</p>
          </div>
        </div>

        {/* Numbers Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <NumbersTable numbers={numbers} onNumberUsed={handleNumberUsed} />
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-card/30 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Numbers automatically reset 24 hours after use at 5:00 AM Pakistan time
        </div>
      </footer>
    </div>
  );
};

export default Index;
