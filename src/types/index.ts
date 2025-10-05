export interface Player {
  id: string;
  name: string;
  balance: number;
  loan: number;
  round: number;
  avatarUrl: string;
}

export type TransactionType =
  | 'pay-bank'
  | 'repay-loan'
  | 'receive-from-bank'
  | 'take-loan'
  | 'player-to-player'
  | 'pass-start'
  | 'interest-added';

export interface Transaction {
  id: string;
  fromId: string; // 'bank' or player.id
  toId: string;   // 'bank' or player.id
  amount: number;
  memo: string;
  type: TransactionType;
  round: number; // The personal round of the player who this log belongs to
  timestamp: number;
  playerId: string; // The player this transaction belongs to in history
  closingBalance: number;
}

export type Role = 'banker' | 'viewer';

export interface GameState {
  players: Player[];
  transactions: Transaction[];
  initialCapital: number;
  gameStarted: boolean;
  role: Role;
}
