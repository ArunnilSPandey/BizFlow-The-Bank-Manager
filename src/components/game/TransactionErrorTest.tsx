'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * This component helps verify that error handling works correctly
 * Only visible in development mode
 */
export default function TransactionErrorTest() {
  const [showTest, setShowTest] = useState(false);
  const { toast } = useToast();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const simulateError = () => {
    try {
      // Simulate an error that would happen during a transaction
      throw new Error("Test error: Insufficient funds");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: e.message || "Unable to complete transaction. Please try again.",
      });
    }
  };

  return (
    <div className="mb-6">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowTest(!showTest)}
      >
        {showTest ? 'Hide' : 'Show'} Error Test Tools
      </Button>

      {showTest && (
        <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These tools are for testing error handling only. Use with caution.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={simulateError}
            >
              Test Toast Error
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}