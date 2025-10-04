'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { GameState, Player, Transaction, TransactionType } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BANK_PLAYER_ID, LOAN_INTEREST_RATE, PASS_START_AMOUNT } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

const initialGameState: GameState = {
  players: [],
  transactions: [],
  initialCapital: 15000,
  gameStarted: false,
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
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('bizflow_gamestate');
      if (savedState) {
        setGameState(JSON.parse(savedState));
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
    setGameState(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
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
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const { fromId, toId, amount, type, memo } = details;

      const fromPlayerIndex = newPlayers.findIndex(p => p.id === fromId);
      const toPlayerIndex = newPlayers.findIndex(p => p.id === toId);

      const fromPlayer = fromPlayerIndex !== -1 ? newPlayers[fromPlayerIndex] : null;
      const toPlayer = toPlayerIndex !== -1 ? newPlayers[toPlayerIndex] : null;

      try {
        switch (type) {
          case 'player-to-player':
            if (fromPlayer && toPlayer) {
              if (fromPlayer.balance < amount) throw new Error(`${fromPlayer.name} has insufficient funds.`);
              fromPlayer.balance -= amount;
              toPlayer.balance += amount;
              addTransactionToLog(fromPlayer, { fromId, toId, amount, type, memo }, fromPlayer.balance);
              addTransactionToLog(toPlayer, { fromId, toId, amount, type, memo }, toPlayer.balance);
            }
            break;

          case 'pay-bank':
            if (fromPlayer) {
              if (fromPlayer.balance < amount) throw new Error(`${fromPlayer.name} has insufficient funds.`);
              fromPlayer.balance -= amount;
              addTransactionToLog(fromPlayer, { fromId, toId, amount, type, memo }, fromPlayer.balance);
            }
            break;

          case 'repay-loan':
            if (fromPlayer) {
              const repayAmount = Math.min(amount, fromPlayer.loan);
              if (fromPlayer.balance < repayAmount) throw new Error(`${fromPlayer.name} has insufficient funds to repay ${repayAmount}.`);
              fromPlayer.balance -= repayAmount;
              fromPlayer.loan -= repayAmount;
              addTransactionToLog(fromPlayer, { fromId, toId, amount: repayAmount, type, memo }, fromPlayer.balance);
            }
            break;

          case 'receive-from-bank':
            if (toPlayer) {
              toPlayer.balance += amount;
              addTransactionToLog(toPlayer, { fromId, toId, amount, type, memo }, toPlayer.balance);
            }
            break;

          case 'take-loan':
            if (toPlayer) {
              toPlayer.balance += amount;
              toPlayer.loan += amount;
              addTransactionToLog(toPlayer, { fromId, toId, amount, type, memo }, toPlayer.balance);
            }
            break;
        }
        
        const newGameState = { ...prev, players: newPlayers };
        
        // We call setGameState here to get the correct values for the toast, and then we will update it with the transaction log.
        // It's a bit of a hack but it works for now.
        setGameState(newGameState);

        toast({
            title: "Transaction Successful",
            description: `${fromPlayer?.name || 'Bank'} -> ${toPlayer?.name || 'Bank'}: $${amount.toLocaleString()}`,
        });
        
        return newGameState;
      } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Transaction Failed",
            description: e.message,
        });
        return prev; // Return previous state if transaction fails
      }
    });
  }, [toast]);

  const passStart = (playerId: string) => {
    setGameState(prev => {
        const newPlayers = [...prev.players];
        const playerIndex = newPlayers.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) return prev;

        const player = newPlayers[playerIndex];

        // This is a temporary state to calculate balances and logs sequentially.
        let tempBalance = player.balance;

        // Increment round first
        const nextRound = player.round + 1;
        
        // Add Pass Start money
        tempBalance += PASS_START_AMOUNT;
        addTransactionToLog({...player, round: nextRound}, { fromId: BANK_PLAYER_ID, toId: playerId, amount: PASS_START_AMOUNT, type: 'pass-start', memo: 'Passed START' }, tempBalance);

        let newLoanAmount = player.loan;
        // Handle loan interest
        if (player.loan > 0) {
            const interest = Math.round(player.loan * LOAN_INTEREST_RATE);
            newLoanAmount += interest;
            addTransactionToLog({...player, round: nextRound}, { fromId: BANK_PLAYER_ID, toId: playerId, amount: interest, type: 'interest-added', memo: `10% interest on loan` }, tempBalance);
        }

        // Create the final updated player object
        const updatedPlayer = {
            ...player,
            round: nextRound,
            balance: tempBalance,
            loan: newLoanAmount
        };
        
        newPlayers[playerIndex] = updatedPlayer;

        toast({
            title: `${player.name} Passed START!`,
            description: `Balance updated and round is now ${updatedPlayer.round}.`,
        });

        return { ...prev, players: newPlayers };
    });
};

  const value = {
    gameState,
    loading,
    startGame,
    resetGame,
    performTransaction,
    passStart
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
