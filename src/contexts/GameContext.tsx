'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { GameState, Player, Transaction, TransactionType, Role } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BANK_PLAYER_ID, LOAN_INTEREST_RATE, PASS_START_AMOUNT } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

const initialGameState: GameState = {
  players: [],
  transactions: [],
  initialCapital: 15000,
  gameStarted: false,
  role: 'banker',
};

interface GameContextType {
  gameState: GameState;
  loading: boolean;
  startGame: (playerNames: { name: string }[], initialCapital: number) => void;
  resetGame: () => void;
  performTransaction: (details: {
    fromId: string;
    toId: string;
    amount: number;
    memo: string;
    type: TransactionType;
  }) => void;
  passStart: (playerId: string) => void;
  setRole: (role: Role) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string, description?: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (notification) {
      if (notification.type === 'success') {
        toast({
          title: notification.message,
          description: notification.description,
        });
      } else {
        toast({
          variant: 'destructive',
          title: notification.message,
          description: notification.description,
        });
      }
      setNotification(null);
    }
  }, [notification, toast]);


  useEffect(() => {
    try {
      const savedState = localStorage.getItem('bizflow_gamestate');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Ensure role is set, default to banker if not present
        if (!parsedState.role) {
          parsedState.role = 'banker';
        }
        setGameState(parsedState);
      }
    } catch (error) {
      console.error('Failed to load game state from localStorage', error);
      setGameState(initialGameState);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('bizflow_gamestate', JSON.stringify(gameState));
      } catch (error) {
        console.error('Failed to save game state to localStorage', error);
      }
    }
  }, [gameState, loading]);

  const addTransactionToLog = (
    updatedPlayers: Player[],
    updatedTransactions: Transaction[],
    player: Player,
    tx: Omit<Transaction, 'id' | 'timestamp' | 'playerId' | 'round' | 'closingBalance'>,
    closingBalance: number
  ) => {
    const newTransaction: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      playerId: player.id,
      round: player.round,
      closingBalance: closingBalance
    };
    updatedTransactions.push(newTransaction);
  };

  const startGame = (playerNames: { name: string }[], initialCapital: number) => {
    const players: Player[] = playerNames.map((p, index) => ({
      id: crypto.randomUUID(),
      name: p.name,
      balance: initialCapital,
      loan: 0,
      round: 1,
      avatarUrl: PlaceHolderImages[index % PlaceHolderImages.length].imageUrl,
    }));
    setGameState({
      players,
      initialCapital,
      transactions: [],
      gameStarted: true,
      role: 'banker',
    });
  };
  
  const resetGame = () => {
    localStorage.removeItem('bizflow_gamestate');
    setGameState(initialGameState);
  }

  const performTransaction = useCallback((details: {
    fromId: string;
    toId: string;
    amount: number;
    memo: string;
    type: TransactionType;
  }) => {
    if (gameState.role !== 'banker') {
      setNotification({type: 'error', message: 'Viewer Mode', description: 'Only the Banker can perform transactions.'});
      return;
    }
    let success = false;
    let fromName: string | undefined = 'Bank';
    let toName: string | undefined = 'Bank';

    setGameState(prev => {
      const newPlayers = JSON.parse(JSON.stringify(prev.players));
      const newTransactions = JSON.parse(JSON.stringify(prev.transactions));
      const { fromId, toId, amount, type, memo } = details;

      const fromPlayerIndex = newPlayers.findIndex((p: Player) => p.id === fromId);
      const toPlayerIndex = newPlayers.findIndex((p: Player) => p.id === toId);

      const fromPlayer = fromPlayerIndex !== -1 ? newPlayers[fromPlayerIndex] : null;
      const toPlayer = toPlayerIndex !== -1 ? newPlayers[toPlayerIndex] : null;
      
      fromName = fromPlayer?.name || 'Bank';
      toName = toPlayer?.name || 'Bank';

      try {
        switch (type) {
          case 'player-to-player':
            if (fromPlayer && toPlayer) {
              if (fromPlayer.balance < amount) throw new Error(`${fromPlayer.name} has insufficient funds.`);
              fromPlayer.balance -= amount;
              toPlayer.balance += amount;
              addTransactionToLog(newPlayers, newTransactions, fromPlayer, { fromId, toId, amount, type, memo }, fromPlayer.balance);
              addTransactionToLog(newPlayers, newTransactions, toPlayer, { fromId, toId, amount, type, memo }, toPlayer.balance);
            }
            break;

          case 'pay-bank':
            if (fromPlayer) {
              if (fromPlayer.balance < amount) throw new Error(`${fromPlayer.name} has insufficient funds.`);
              fromPlayer.balance -= amount;
              addTransactionToLog(newPlayers, newTransactions, fromPlayer, { fromId, toId, amount, type, memo }, fromPlayer.balance);
            }
            break;

          case 'repay-loan':
            if (fromPlayer) {
              const repayAmount = Math.min(amount, fromPlayer.loan);
              if (fromPlayer.balance < repayAmount) throw new Error(`${fromPlayer.name} has insufficient funds to repay ${repayAmount}.`);
              fromPlayer.balance -= repayAmount;
              fromPlayer.loan -= repayAmount;
              addTransactionToLog(newPlayers, newTransactions, fromPlayer, { fromId, toId, amount: repayAmount, type, memo }, fromPlayer.balance);
            }
            break;

          case 'receive-from-bank':
            if (toPlayer) {
              toPlayer.balance += amount;
              addTransactionToLog(newPlayers, newTransactions, toPlayer, { fromId, toId, amount, type, memo }, toPlayer.balance);
            }
            break;

          case 'take-loan':
            if (toPlayer) {
              toPlayer.balance += amount;
              toPlayer.loan += amount;
              addTransactionToLog(newPlayers, newTransactions, toPlayer, { fromId, toId, amount, type, memo }, toPlayer.balance);
            }
            break;
        }
        
        success = true;
        return { ...prev, players: newPlayers, transactions: newTransactions };
      } catch (e: any) {
        setNotification({type: 'error', message: 'Transaction Failed', description: e.message});
        return prev; // Return previous state if transaction fails
      }
    });

    if (success) {
      setNotification({
        type: 'success',
        message: 'Transaction Successful',
        description: `${fromName} -> ${toName}: $${details.amount.toLocaleString()}`,
      });
    }
  }, [gameState.role]);

  const passStart = (playerId: string) => {
    if (gameState.role !== 'banker') {
      setNotification({type: 'error', message: 'Viewer Mode', description: 'Only the Banker can perform this action.'});
      return;
    }

    let playerName = '';
    let nextRound = 0;
    
    setGameState(prev => {
        const newPlayers = JSON.parse(JSON.stringify(prev.players));
        const newTransactions = JSON.parse(JSON.stringify(prev.transactions));
        const playerIndex = newPlayers.findIndex((p: Player) => p.id === playerId);
        
        if (playerIndex === -1) return prev;

        const player = newPlayers[playerIndex];
        playerName = player.name;
        nextRound = player.round + 1;

        player.round = nextRound;
        
        player.balance += PASS_START_AMOUNT;
        addTransactionToLog(newPlayers, newTransactions, player, { fromId: BANK_PLAYER_ID, toId: playerId, amount: PASS_START_AMOUNT, type: 'pass-start', memo: 'Passed START' }, player.balance);

        if (player.loan > 0) {
            const interest = Math.round(player.loan * LOAN_INTEREST_RATE);
            player.loan += interest;
            addTransactionTolog(newPlayers, newTransactions, player, { fromId: BANK_PLAYER_ID, toId: playerId, amount: interest, type: 'interest-added', memo: `10% interest on loan` }, player.balance);
        }
        
        return { ...prev, players: newPlayers, transactions: newTransactions };
    });

    if(playerName && nextRound > 0) {
        setNotification({
            type: 'success',
            message: `${playerName} Passed START!`,
            description: `Balance updated and round is now ${nextRound}.`,
        });
    }
};

  const setRole = (role: Role) => {
    setGameState(prev => ({ ...prev, role }));
  };

  const value = {
    gameState,
    loading,
    startGame,
    resetGame,
    performTransaction,
    passStart,
    setRole,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
