'use client';
import { useGame } from '@/contexts/GameContext';
import NewGameSetup from '@/components/game/NewGameSetup';
import Dashboard from '@/components/game/Dashboard';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Landmark } from 'lucide-react';

export default function GameWrapper() {
  const { gameState, loading, resetGame } = useGame();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
            <Landmark className="mx-auto h-16 w-16 text-primary" />
            <h1 className="mt-4 text-4xl font-headline text-primary">BizFlow</h1>
            <p className="text-muted-foreground animate-pulse">Loading your game...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen">
      {gameState.gameStarted ? <Dashboard /> : <NewGameSetup />}
      {gameState.gameStarted && (
        <div className="absolute bottom-4 right-4">
            <Button variant="destructive" size="sm" onClick={resetGame}>End Game</Button>
        </div>
      )}
    </div>
  );
}
