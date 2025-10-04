import type { Transaction, TransactionType } from "@/types";
import { useGame } from "@/contexts/GameContext";
import { cn } from "@/lib/utils";
import { BANK_PLAYER_ID } from "@/lib/constants";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Landmark,
  Users,
  Undo2,
  Download,
  PartyPopper,
  Percent,
  Banknote,
} from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
  currentPlayerId: string;
}

const getTransactionIcon = (type: TransactionType) => {
  const iconProps = { className: "h-6 w-6 p-1 rounded-full" };
  switch (type) {
    case 'pay-bank':
      return <Banknote {...iconProps} />;
    case 'repay-loan':
      return <Undo2 {...iconProps} />;
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
    default:
      return <Banknote {...iconProps} />;
  }
};

const getFlowIcons = (fromId: string, toId: string, currentId: string) => {
    const isCredit = toId === currentId;
    
    if (fromId === BANK_PLAYER_ID || toId === BANK_PLAYER_ID) {
        return (
            <div className="flex items-center gap-1">
                {isCredit ? <Landmark className="h-4 w-4 text-muted-foreground" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                <ArrowRight className={cn("h-4 w-4", isCredit ? "text-green-500" : "text-destructive")} />
                {isCredit ? <Users className="h-4 w-4 text-muted-foreground" /> : <Landmark className="h-4 w-4 text-muted-foreground" />}
            </div>
        );
    }
    
    return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />;
}

export default function TransactionItem({ transaction, currentPlayerId }: TransactionItemProps) {
  const { gameState } = useGame();
  const { fromId, toId, amount, memo, type } = transaction;

  const from = fromId === BANK_PLAYER_ID ? { name: "Bank" } : gameState.players.find(p => p.id === fromId);
  const to = toId === BANK_PLAYER_ID ? { name: "Bank" } : gameState.players.find(p => p.id === toId);

  const isCredit = toId === currentPlayerId && type !== 'interest-added' && type !== 'take-loan';
  const isDebit = fromId === currentPlayerId && type !== 'repay-loan';
  
  let amountColor = 'text-foreground';
  if (isCredit) amountColor = 'text-green-600';
  if (isDebit) amountColor = 'text-destructive';
  if (type === 'interest-added' || type === 'take-loan' || type === 'repay-loan') amountColor = 'text-destructive';


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

  return (
    <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent">
      <div className={cn("rounded-full bg-secondary text-secondary-foreground", amountColor, isCredit ? "bg-green-100" : isDebit ? "bg-red-100" : "bg-gray-100")}>
        {getTransactionIcon(type)}
      </div>
      <div className="flex-grow">
        <p className="font-semibold">{description}</p>
        <p className="text-sm text-muted-foreground">{memo}</p>
      </div>
      <div className="text-right">
        <p className={cn("font-semibold text-lg", amountColor)}>
          {isCredit ? '+' : isDebit ? '-' : ''}${amount.toLocaleString()}
        </p>
        {getFlowIcons(fromId, toId, currentPlayerId)}
      </div>
    </div>
  );
}
