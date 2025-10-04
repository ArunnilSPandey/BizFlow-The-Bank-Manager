'use client';
import { GameProvider } from '@/contexts/GameContext';
import GameWrapper from '@/components/game/GameWrapper';

export default function Home() {
  return (
    <GameProvider>
      <main>
        <GameWrapper />
      </main>
    </GameProvider>
  );
}
