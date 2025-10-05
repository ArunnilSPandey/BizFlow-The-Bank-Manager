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
import { Button } from '@/components/ui/button';
import { Hand, Eye, Banknote, Users, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserPresence from './UserPresence';

export default function Dashboard() {
  const { game, userGameRole, players, resetGame } = useGame();
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    source: Player | 'bank' | null;
    destination: Player | 'bank' | null;
  }>({ isOpen: false, source: null, destination: null });
  const { toast } = useToast();

  const isMobile = useIsMobile();
  const isBanker = userGameRole?.role === 'Banker';

  const handleDragStart = (playerId: string) => {
    if (!isBanker) return;
    setDraggedPlayerId(playerId);
  };

  const handleDragEnd = () => {
    if (!isBanker) return;
    setDraggedPlayerId(null);
  };

  const openTransactionModal = (sourceId: string, destinationId: string) => {
    if (!isBanker || sourceId === destinationId) return;

    const sourcePlayer = sourceId === BANK_PLAYER_ID ? 'bank' : players.find(p => p.id === sourceId);
    const destinationPlayer = destinationId === BANK_PLAYER_ID ? 'bank' : players.find(p => p.id === destinationId);

    if (sourcePlayer && destinationPlayer) {
      setModalState({ isOpen: true, source: sourcePlayer, destination: destinationPlayer });
    }
  };

  const handleDrop = (destinationId: string) => {
    if (!isBanker || !draggedPlayerId) return;
    openTransactionModal(draggedPlayerId, destinationId);
  };

  const handleCardClick = (id: string) => {
    if (!isMobile || !isBanker) return;

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

  const copyGameCode = () => {
    if (game?.gameCode) {
        navigator.clipboard.writeText(game.gameCode);
        toast({
            title: "Game Code Copied!",
            description: `You can now share "${game.gameCode}" with other players.`,
        });
    }
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-5xl font-headline text-primary">BizFlow</h1>
          <p className="text-muted-foreground">
            A Digital Ledger for the Business Board Game
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <UserPresence />
            <Button variant="outline" size="sm" onClick={copyGameCode}>
                <Copy className="mr-2" /> {game?.gameCode}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You are a <span className={isBanker ? "font-bold text-primary" : "font-bold"}>{userGameRole?.role}</span>
          </p>
        </div>
      </div>

      <p className="text-center text-muted-foreground mb-8">
        {isBanker && (isMobile ? "Tap a card to select a source, then tap another for the destination." : "Drag and drop cards to make transactions.")}
        {!isBanker && "You are in Viewer Mode. No changes can be made."}
      </p>

      {isMobile && selectedId && isBanker && (
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
          isBanker={isBanker}
        />
        {players.map(player => (
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
            isBanker={isBanker}
          />
        ))}
      </div>
      
      <div className="absolute bottom-4 right-4">
        {isBanker && <Button variant="destructive" size="sm" onClick={resetGame}>End Game</Button>}
      </div>

      {isBanker && (
        <TransactionModal
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
          source={modalState.source}
          destination={modalState.destination}
        />
      )}
    </div>
  );
}
