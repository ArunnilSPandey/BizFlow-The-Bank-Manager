'use client';
import { useState } from 'react';
import type { Player } from '@/types';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { History, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import TransactionHistorySheet from './TransactionHistorySheet';

interface PlayerCardProps {
  player: Player;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: (destinationId: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
}

export default function PlayerCard({ player, onDragStart, onDragEnd, onDrop, isDragging, isDropTarget }: PlayerCardProps) {
  const { passStart } = useGame();
  const [isDragOver, setIsDragOver] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isDropTarget) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(player.id);
  };

  return (
    <>
      <Card
        draggable
        onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', player.id);
            onDragStart();
        }}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col transition-all duration-200 ease-in-out cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl',
          isDragging && 'opacity-50 scale-95',
          isDragOver && 'ring-2 ring-primary ring-offset-2',
        )}
        data-drag-over={isDragOver}
      >
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="boardgame piece" />
            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="font-headline text-2xl">{player.name}</CardTitle>
            <CardDescription>Round: {player.round}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
            <div className='text-center'>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-4xl font-bold text-primary">${player.balance.toLocaleString()}</p>
            </div>
            {player.loan > 0 && (
                 <div className='text-center text-destructive'>
                    <p className="text-sm">Loan Amount</p>
                    <p className="text-lg font-semibold">(${player.loan.toLocaleString()})</p>
                </div>
            )}
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="mr-2 h-4 w-4" /> History
            </Button>
            <Button onClick={() => passStart(player.id)} className='bg-green-600 hover:bg-green-700 text-white'>
                <Zap className="mr-2 h-4 w-4" /> Pass 'START'
            </Button>
        </CardFooter>
      </Card>
      <TransactionHistorySheet
        player={player}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
