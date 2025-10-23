import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveNumbers, getNumbersWithReset, PhoneNumber } from "@/lib/csvNumberService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UploadNumbersProps {
  onUploadSuccess?: () => void;
}

export const UploadNumbers = ({ onUploadSuccess }: UploadNumbersProps) => {
  const [open, setOpen] = useState(false);
  const [numberText, setNumberText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!numberText.trim()) {
      toast.error("Please enter at least one number");
      return;
    }

    setIsUploading(true);
    try {
      // Parse numbers from textarea - support multiple formats
      const lines = numberText
        .split(/[\n,;]+/) // Support newlines, commas, or semicolons as separators
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.toLowerCase().includes('number')) // Skip header lines
        .map(line => {
          // Extract number from various formats (e.g., "123456", "123456,available", etc.)
          const parts = line.split(',');
          return parts[0].trim();
        })
        .filter(num => num.length > 0);

      if (lines.length === 0) {
        toast.error("No valid numbers found");
        setIsUploading(false);
        return;
      }

      // Remove duplicates
      const uniqueNumbers = [...new Set(lines)];

      // Get existing numbers
      const existingNumbers = await getNumbersWithReset();
      const existingNumbersSet = new Set(existingNumbers.map(n => n.number));

      // Filter out duplicates
      const newNumbers = uniqueNumbers.filter(num => !existingNumbersSet.has(num));

      if (newNumbers.length === 0) {
        toast.info("All numbers already exist in the system");
        setIsUploading(false);
        return;
      }

      // Convert to PhoneNumber format
      const phoneNumbers: PhoneNumber[] = newNumbers.map(number => ({
        number,
        status: 'available',
        last_used: null,
      }));

      // Append to existing numbers
      const allNumbers = [...existingNumbers, ...phoneNumbers];
      await saveNumbers(allNumbers);

      const skippedCount = uniqueNumbers.length - newNumbers.length;
      const message = skippedCount > 0 
        ? `Successfully uploaded ${newNumbers.length} numbers (${skippedCount} duplicates skipped)`
        : `Successfully uploaded ${newNumbers.length} numbers`;
      
      toast.success(message);
      
      // Clear form and close dialog
      setNumberText("");
      setOpen(false);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Error uploading numbers:', error);
      toast.error('Failed to upload numbers');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAll = () => {
    if (!numberText) return;
    const textarea = document.querySelector('textarea[aria-label="Enter phone numbers"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.select();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Phone Numbers</DialogTitle>
          <DialogDescription>
            Paste or type phone numbers below. You can enter multiple numbers separated by new lines, commas, or semicolons.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="numbers">Phone Numbers</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSelectAll}
                disabled={!numberText}
              >
                Select All
              </Button>
            </div>
            <Textarea
              id="numbers"
              aria-label="Enter phone numbers"
              placeholder="Enter phone numbers here...\n\nExamples:\n+1234567890\n+0987654321\n+1122334455"
              value={numberText}
              onChange={(e) => setNumberText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: You can paste numbers from a spreadsheet or copy-paste from any source. Duplicates will be automatically skipped.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !numberText.trim()}>
            {isUploading ? "Uploading..." : "Upload Numbers"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
