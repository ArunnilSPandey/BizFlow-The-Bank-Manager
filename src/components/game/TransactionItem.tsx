'use client'

import type { Player, Transaction, TransactionType } from "@/types";
import { cn } from "@/lib/utils";
import { BANK_PLAYER_ID } from "@/lib/constants";
import {
  ArrowLeftRight,
  Landmark,
  Users,
  Undo,
  Download,
  PartyPopper,
  Percent,
  Banknote,
  Wallet,
  RotateCcw,
} from "lucide-react";
import { Button } from "../ui/button";
import { useGame } from "@/contexts/GameContext";
import { useFirestore } from "@/firebase";
import { undoTransaction } from "@/lib/transactions";
import { useToast } from "@/hooks/use-toast";

interface TransactionItemProps {
  transaction: Transaction;
  currentPlayerId: string;
  allPlayers: Player[];
  isBanker: boolean;
}

const getTransactionIcon = (type: TransactionType) => {
  const iconProps = { className: "h-6 w-6 p-1 rounded-full" };
  switch (type) {
    case 'pay-bank':
      return <Banknote {...iconProps} />;
    case 'repay-loan':
      return <Undo {...iconProps} />;
    case 'receive-from-bank':
      return <Banknote {...iconProps} />;
    case 'take-loan':
      return <Download {...iconProps} />;
    case 'player-to-player':
      return <Users {...iconProps} />;
    case 'pass-start':
      return <PartyPopper {...iconProps} />;
    case 'interest-added':
        return <Percent {...iconProps} />;
    case 'undo':
        return <RotateCcw {...iconProps} />;
    default:
      return <Banknote {...iconProps} />;
  }
};


export default function TransactionItem({ transaction, currentPlayerId, allPlayers, isBanker }: TransactionItemProps) {
  const { fromId, toId, amount, memo, type, closingBalance } = transaction;
  const { gameId } = useGame();
  const firestore = useFirestore();
  const { toast } = useToast();

  const from = fromId === BANK_PLAYER_ID ? { name: "Bank" } : allPlayers.find(p => p.id === fromId);
  const to = toId === BANK_PLAYER_ID ? { name: "Bank" } : allPlayers.find(p => p.id === toId);

  const isCredit = toId === currentPlayerId && type !== 'interest-added' && type !== 'take-loan';
  const isDebit = fromId === currentPlayerId && type !== 'repay-loan';
  
  let amountColor = 'text-foreground';
  if (isCredit) amountColor = 'text-green-600';
  if (isDebit) amountColor = 'text-destructive';
  if (type === 'interest-added' || type === 'take-loan') amountColor = 'text-destructive';
  if (type === 'repay-loan' && fromId === currentPlayerId) amountColor = 'text-destructive';
  if (type === 'undo') amountColor = 'text-blue-500';


  let description = '';
  if (type === 'player-to-player') {
    description = fromId === currentPlayerId ? `Paid ${to?.name}` : `Received from ${from?.name}`;
  } else if (fromId === BANK_PLAYER_ID) {
    description = `Received from Bank`;
  } else if (toId === BANK_PLAYER_ID) {
    description = `Paid Bank`;
  }

  if (type === 'pass-start') description = 'Passed START';
  if (type === 'interest-added') description = 'Loan Interest';
  if (type === 'take-loan') description = `Loan from Bank`;
  if (type === 'repay-loan') description = `Repaid loan to Bank`;
  if (type === 'undo') description = `Undo: ${memo}`;


  const handleUndo = async () => {
    if (!isBanker || !gameId || !firestore) return;
    try {
      await undoTransaction(firestore, gameId, transaction, allPlayers);
      toast({ title: "Transaction Undone", description: "The transaction has been reversed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Undo Failed", description: e.message });
    }
  }

  const canBeUndone = type !== 'undo' && type !== 'interest-added';

  return (
    <div className="flex items-start gap-4 p-2 rounded-lg hover:bg-accent">
      <div className={cn("rounded-full text-secondary-foreground mt-1", isCredit ? "bg-green-100 text-green-600" : isDebit ? "bg-red-100 text-destructive" : type === 'undo' ? 'bg-blue-100 text-blue-500' : "bg-gray-100 text-gray-600")}>
        {getTransactionIcon(type)}
      </div>
      <div className="flex-grow">
        <p className="font-semibold">{description}</p>
        <p className="text-sm text-muted-foreground">{memo}</p>
         {isBanker && canBeUndone && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={handleUndo}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Undo Transaction
          </Button>
        )}
      </div>
      <div className="text-right">
        <p className={cn("font-semibold text-lg", amountColor)}>
          {isCredit ? '+' : isDebit ? '-' : ''}${amount.toLocaleString()}
        </p>
        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Wallet className="h-3 w-3" />
            {closingBalance !== undefined && (
                <span>${closingBalance.toLocaleString()}</span>
            )}
        </div>
      </div>
    </div>
  );
}
