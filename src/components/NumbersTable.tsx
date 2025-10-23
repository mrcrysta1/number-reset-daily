import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface NumberRecord {
  id: string;
  number: string;
  used: boolean;
  last_used_at: string | null;
}

interface NumbersTableProps {
  numbers: NumberRecord[];
  onNumberUsed: (number: string) => void;
}

export const NumbersTable = ({ numbers, onNumberUsed }: NumbersTableProps) => {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [usingNumbers, setUsingNumbers] = useState<Set<string>>(new Set());

  const handleCopyAndUse = async (number: string) => {
    if (usingNumbers.has(number)) return;

    setUsingNumbers(prev => new Set(prev).add(number));

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(number);
      setCopiedNumber(number);

      // Mark as used
      onNumberUsed(number);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedNumber(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy number');
      setUsingNumbers(prev => {
        const newSet = new Set(prev);
        newSet.delete(number);
        return newSet;
      });
    }
  };

  if (numbers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-xl text-muted-foreground">No available numbers at the moment</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Numbers reset daily at 5:00 AM Pakistan time
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Phone Number
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {numbers.map((record) => (
              <tr
                key={record.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
              >
                <td className="px-6 py-4 text-foreground font-mono">{record.number}</td>
                <td className="px-6 py-4 text-right">
                  <Button
                    onClick={() => handleCopyAndUse(record.number)}
                    disabled={usingNumbers.has(record.number)}
                    variant="default"
                    size="sm"
                    className="min-w-[120px]"
                  >
                    {copiedNumber === record.number ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy & Use
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
