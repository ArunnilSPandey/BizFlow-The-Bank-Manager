
import type { Player, Transaction, TransactionType } from "@/types";
import { cn } from "@/lib/utils";
import { BANK_PLAYER_ID } from "@/lib/constants";
import {
  ArrowLeftRight,
  Landmark,
  Users,
  Undo2,
  Download,
  PartyPopper,
  Percent,
  Banknote,
  Wallet,
} from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
  currentPlayerId: string;
  allPlayers: Player[];
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
    
    if (fromId === BANK_PLAYER_ID) {
      return <Landmark className="h-4 w-4 text-green-500" />;
    }
    if (toId === BANK_PLAYER_ID) {
      return <Landmark className="h-4 w-4 text-destructive" />;
    }
    
    return <Users className="h-4 w-4 text-muted-foreground" />;
}

export default function TransactionItem({ transaction, currentPlayerId, allPlayers }: TransactionItemProps) {
  const { fromId, toId, amount, memo, type, closingBalance } = transaction;

  const from = fromId === BANK_PLAYER_ID ? { name: "Bank" } : allPlayers.find(p => p.id === fromId);
  const to = toId === BANK_PLAYER_ID ? { name: "Bank" } : allPlayers.find(p => p.id === toId);

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
      <div className={cn("rounded-full text-secondary-foreground", isCredit ? "bg-green-100 text-green-600" : isDebit ? "bg-red-100 text-destructive" : "bg-gray-100 text-gray-600")}>
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
