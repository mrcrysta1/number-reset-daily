import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UploadNumbersProps {
  onUploadComplete: () => void;
}

export const UploadNumbers = ({ onUploadComplete }: UploadNumbersProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Remove header if present
      const numbers = lines
        .filter(line => !line.toLowerCase().includes('number'))
        .map(line => line.split(',')[0].trim())
        .filter(num => num.length > 0);

      if (numbers.length === 0) {
        toast.error('No valid numbers found in file');
        return;
      }

      // Upload numbers via edge function
      const { error } = await supabase.functions.invoke('upload-numbers', {
        body: { numbers },
      });

      if (error) throw error;

      toast.success(`Successfully uploaded ${numbers.length} numbers`);
      onUploadComplete();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading numbers:', error);
      toast.error('Failed to upload numbers');
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload CSV
      </Button>
    </>
  );
};
