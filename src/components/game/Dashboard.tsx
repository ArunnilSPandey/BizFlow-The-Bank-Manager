'use client';
import { useGame } from '@/contexts/GameContext';
import PlayerCard from './PlayerCard';
import BankCard from './BankCard';
import { useState } from 'react';
import type { Player } from '@/types';
import { BANK_PLAYER_ID } from '@/lib/constants';
import TransactionModal from './TransactionModal';

export default function Dashboard() {
  const { gameState } = useGame();
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    source: Player | 'bank' | null;
    destination: Player | 'bank' | null;
  }>({ isOpen: false, source: null, destination: null });

  const handleDragStart = (playerId: string) => {
    setDraggedPlayerId(playerId);
  };

  const handleDragEnd = () => {
    setDraggedPlayerId(null);
  };

  const handleDrop = (destinationId: string) => {
    if (!draggedPlayerId || draggedPlayerId === destinationId) return;

    const sourcePlayer = gameState.players.find(p => p.id === draggedPlayerId);
    if (!sourcePlayer) return;

    if (destinationId === BANK_PLAYER_ID) {
      // Player -> Bank
      setModalState({ isOpen: true, source: sourcePlayer, destination: 'bank' });
    } else {
      // Player -> Player
      const destinationPlayer = gameState.players.find(p => p.id === destinationId);
      if (destinationPlayer) {
        setModalState({ isOpen: true, source: sourcePlayer, destination: destinationPlayer });
      }
    }
  };
  
  const handleBankDrop = (sourcePlayerId: string) => {
     // Bank -> Player
    const sourcePlayer = gameState.players.find(p => p.id === sourcePlayerId);
     if (sourcePlayer) {
        setModalState({ isOpen: true, source: 'bank', destination: sourcePlayer });
     }
  }


  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-5xl font-headline text-center mb-2 text-primary">BizFlow</h1>
      <p className="text-center text-muted-foreground mb-8">Drag and drop cards to make transactions.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <BankCard
          onDragStart={() => handleDragStart(BANK_PLAYER_ID)}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          isDragging={draggedPlayerId === BANK_PLAYER_ID}
        />
        {gameState.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            onDragStart={() => handleDragStart(player.id)}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            isDragging={draggedPlayerId === player.id}
            isDropTarget={!!draggedPlayerId && draggedPlayerId !== player.id}
            onBankDrop={() => handleBankDrop(player.id)}
          />
        ))}
      </div>

      <TransactionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, source: null, destination: null })}
        source={modalState.source}
        destination={modalState.destination}
      />
    </div>
  );
}
