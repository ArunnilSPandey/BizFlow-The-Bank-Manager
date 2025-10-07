'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';

export default function ErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Prevent the error from bubbling up to the window
      event.preventDefault();
      setError(event.error);
      
      // Log the error for debugging
      console.error('Error caught by boundary:', event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          {error.message || "An unexpected error occurred"}
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload Application
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}