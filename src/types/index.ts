import { Timestamp } from 'firebase/firestore';

export interface Game {
    id: string;
    gameCode: string;
    initialCapital: number;
    gameStarted: boolean;
    createdAt: Timestamp;
}

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
  round: number; 
  timestamp: Timestamp;
  playerId: string; // The player this transaction belongs to in history
  closingBalance: number;
}

export type Role = 'Banker' | 'Viewer';

export interface UserGameRole {
    id: string;
    userId: string;
    role: Role;
    onlineStatus: boolean;
    lastSeen: Timestamp;
}
