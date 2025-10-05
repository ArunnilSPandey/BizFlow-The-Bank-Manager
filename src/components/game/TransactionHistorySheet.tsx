'use client';
import { useMemo } from 'react';
import type { Player, Transaction } from '@/types';
import { useGame } from '@/contexts/GameContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import TransactionItem from './TransactionItem';
import { Timestamp } from 'firebase/firestore';

interface TransactionHistorySheetProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionHistorySheet({ player, isOpen, onClose }: TransactionHistorySheetProps) {
  const { transactions, players } = useGame();

  const groupedTransactions = useMemo(() => {
    if (!transactions) return {};

    const playerTransactions = transactions
      .filter(tx => tx.fromId === player.id || tx.toId === player.id)
      .sort((a, b) => {
        const timestampA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : a.timestamp;
        const timestampB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : b.timestamp;
        return timestampB - timestampA;
      });

    return playerTransactions.reduce((acc, tx) => {
      const round = tx.round;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(tx);
      return acc;
    }, {} as Record<number, Transaction[]>);
  }, [transactions, player.id]);

  const sortedRounds = Object.keys(groupedTransactions).map(Number).sort((a, b) => b - a);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">{player.name}'s History</SheetTitle>
          <SheetDescription>A log of all financial activities.</SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-grow">
          <div className="pr-4">
            {sortedRounds.length > 0 ? (
              sortedRounds.map(round => (
                <div key={round} className="my-4">
                  <h3 className="text-lg font-bold font-headline text-primary mb-2 sticky top-0 bg-card/80 backdrop-blur-sm py-1">
                    Round {round}
                  </h3>
                  <div className="space-y-3">
                    {groupedTransactions[round].map(tx => (
                      <TransactionItem key={tx.id} transaction={tx} currentPlayerId={player.id} allPlayers={players} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>No transactions yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
