'use client';
import { useGame } from '@/contexts/GameContext';
import PlayerCard from './PlayerCard';
import BankCard from './BankCard';
import { useState } from 'react';
import type { Player } from '@/types';
import { BANK_PLAYER_ID } from '@/lib/constants';
import TransactionModal from './TransactionModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Hand } from 'lucide-react';

export default function Dashboard() {
  const { gameState } = useGame();
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    source: Player | 'bank' | null;
    destination: Player | 'bank' | null;
  }>({ isOpen: false, source: null, destination: null });

  const isMobile = useIsMobile();

  const handleDragStart = (playerId: string) => {
    setDraggedPlayerId(playerId);
  };

  const handleDragEnd = () => {
    setDraggedPlayerId(null);
  };

  const openTransactionModal = (sourceId: string, destinationId: string) => {
    if (sourceId === destinationId) return;

    const sourcePlayer = sourceId === BANK_PLAYER_ID ? 'bank' : gameState.players.find(p => p.id === sourceId);
    const destinationPlayer = destinationId === BANK_PLAYER_ID ? 'bank' : gameState.players.find(p => p.id === destinationId);

    if (sourcePlayer && destinationPlayer) {
      setModalState({ isOpen: true, source: sourcePlayer, destination: destinationPlayer });
    }
  };

  const handleDrop = (destinationId: string) => {
    if (draggedPlayerId) {
      openTransactionModal(draggedPlayerId, destinationId);
    }
  };

  const handleCardClick = (id: string) => {
    if (!isMobile) return;

    if (!selectedId) {
      // First selection
      setSelectedId(id);
    } else {
      // Second selection (destination)
      openTransactionModal(selectedId, id);
      setSelectedId(null); // Reset selection
    }
  };

  const handleModalClose = () => {
    setModalState({ isOpen: false, source: null, destination: null });
    setSelectedId(null); // Also reset selection when modal is closed
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-5xl font-headline text-center mb-2 text-primary">BizFlow</h1>
      <p className="text-center text-muted-foreground mb-8">
        {isMobile ? "Tap a card to select a source, then tap another for the destination." : "Drag and drop cards to make transactions."}
      </p>

      {isMobile && selectedId && (
         <Alert className="mb-4 max-w-md mx-auto bg-accent border-primary text-primary">
            <Hand className="h-4 w-4" />
           <AlertTitle className="font-semibold">Source Selected!</AlertTitle>
           <AlertDescription>
             Now tap a destination card to complete the transfer.
           </AlertDescription>
         </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <BankCard
          onDragStart={() => handleDragStart(BANK_PLAYER_ID)}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onClick={() => handleCardClick(BANK_PLAYER_ID)}
          isDragging={draggedPlayerId === BANK_PLAYER_ID}
          isSelected={selectedId === BANK_PLAYER_ID}
          isDropTarget={!!(draggedPlayerId || selectedId) && (draggedPlayerId !== BANK_PLAYER_ID && selectedId !== BANK_PLAYER_ID)}
        />
        {gameState.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            onDragStart={() => handleDragStart(player.id)}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onClick={() => handleCardClick(player.id)}
            isDragging={draggedPlayerId === player.id}
            isSelected={selectedId === player.id}
            isDropTarget={!!(draggedPlayerId || selectedId) && (draggedPlayerId !== player.id && selectedId !== player.id)}
          />
        ))}
      </div>

      <TransactionModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        source={modalState.source}
        destination={modalState.destination}
      />
    </div>
  );
}
