'use client';
import { useGame } from '@/contexts/GameContext';
import NewGameSetup from '@/components/game/NewGameSetup';
import Dashboard from '@/components/game/Dashboard';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Landmark } from 'lucide-react';
import GameLobby from './GameLobby';

export default function GameWrapper() {
  const { game, loading, resetGame } = useGame();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <Landmark className="mx-auto h-16 w-16 text-primary animate-pulse" />
          <h1 className="mt-4 text-4xl font-headline text-primary">BizFlow</h1>
          <p className="text-muted-foreground animate-pulse">Loading your game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    // This case should ideally be handled by the page routing back to home.
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="text-center">
                <Landmark className="mx-auto h-16 w-16 text-destructive" />
                <h1 className="mt-4 text-4xl font-headline text-destructive">Error</h1>
                <p className="text-muted-foreground">Could not load game data.</p>
                <Button onClick={resetGame} className="mt-4">Go Home</Button>
            </div>
        </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {!game.gameStarted ? <GameLobby /> : <Dashboard />}
    </div>
  );
}
