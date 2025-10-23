import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const ExportNumbers = () => {
  const handleExport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('export-used-numbers');

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'used_numbers.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Used numbers exported successfully');
    } catch (error) {
      console.error('Error exporting numbers:', error);
      toast.error('Failed to export numbers');
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Export Used
    </Button>
  );
};
