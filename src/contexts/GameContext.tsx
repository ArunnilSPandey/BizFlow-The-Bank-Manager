'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  doc,
  runTransaction,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
  onSnapshot,
  setDoc,
  addDoc,
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { Game, Player, Transaction, TransactionType, Role, UserGameRole } from '@/types';
import { BANK_PLAYER_ID, LOAN_INTEREST_RATE, PASS_START_AMOUNT } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface GameContextType {
  game: Game | null;
  players: Player[];
  transactions: Transaction[];
  userGameRole: UserGameRole | null;
  gameId: string | null;
  error: string | null;
  loading: boolean;
  createGame: () => void;
  joinGame: (gameCode: string) => void;
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

const LOCAL_STORAGE_GAME_ID_KEY = 'bizflow_gameId';

export function GameProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userGameRole, setUserGameRole] = useState<UserGameRole | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load gameId from localStorage on initial load
  useEffect(() => {
    const savedGameId = localStorage.getItem(LOCAL_STORAGE_GAME_ID_KEY);
    if (savedGameId) {
      setGameId(savedGameId);
    }
    setLoading(false);
  }, []);

  // Subscribe to game data when gameId or user changes
  useEffect(() => {
    if (!gameId || !user) return;

    setLoading(true);

    const gameRef = doc(firestore, 'games', gameId);

    const unsubGame = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        setGame({ id: doc.id, ...doc.data() } as Game);
        setError(null);
      } else {
        setError('Game not found.');
        resetGame(); // Game was deleted or does not exist.
      }
    }, (e) => {
      console.error("Game subscription error:", e);
      setError('Could not subscribe to game data.');
    });

    const playersRef = collection(firestore, 'games', gameId, 'players');
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setPlayers(playersData);
    });

    const transactionsRef = collection(firestore, 'games', gameId, 'transactions');
    const unsubTransactions = onSnapshot(transactionsRef, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(transactionsData);
    });

    const userRoleRef = doc(firestore, 'games', gameId, 'userGameRoles', user.uid);
    const unsubUserRole = onSnapshot(userRoleRef, (doc) => {
      if (doc.exists()) {
        setUserGameRole(doc.data() as UserGameRole);
      }
    });

    setLoading(false);

    return () => {
      unsubGame();
      unsubPlayers();
      unsubTransactions();
      unsubUserRole();
    };
  }, [gameId, user, firestore]);

  const generateGameCode = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `BIZ-${code}`;
  };

  const createGame = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to create a game.');
      return;
    }

    setLoading(true);
    setError(null);

    const gameCode = generateGameCode();
    
    const gameData: Omit<Game, 'id'> = {
      gameCode,
      initialCapital: 15000, // Default value
      gameStarted: false,
      createdAt: serverTimestamp(),
    };
    
    const roleData: Omit<UserGameRole, 'id'> = {
        userId: user.uid,
        role: 'Banker',
        onlineStatus: true,
        lastSeen: serverTimestamp(),
    };

    try {
      // Step 1: Create the game document
      const gameCollectionRef = collection(firestore, 'games');
      const newGameRef = await addDoc(gameCollectionRef, gameData);
      
      // Step 2: Create the user role sub-document
      const roleDocRef = doc(firestore, 'games', newGameRef.id, 'userGameRoles', user.uid);
      await setDoc(roleDocRef, roleData);

      localStorage.setItem(LOCAL_STORAGE_GAME_ID_KEY, newGameRef.id);
      setGameId(newGameRef.id);
    } catch (error) {
      const permError = new FirestorePermissionError({
        path: 'games', // Use collection path for create operation
        operation: 'create',
        requestResourceData: { game: gameData, role: roleData }
      });
      errorEmitter.emit('permission-error', permError);
      setError("Failed to create game. Check permissions.");
    } finally {
      setLoading(false);
    }
  }, [firestore, user]);

  const joinGame = useCallback(async (gameCode: string) => {
    if (!user) {
      setError('You must be signed in to join a game.');
      return;
    }

    setLoading(true);
    setError(null);

    const gamesQuery = query(collection(firestore, 'games'), where('gameCode', '==', gameCode));
    
    try {
      const querySnapshot = await getDocs(gamesQuery);
      if (querySnapshot.empty) {
        setError('No game found with this code.');
        setLoading(false);
        return;
      }

      const gameDoc = querySnapshot.docs[0];
      const joinedGameId = gameDoc.id;

      const roleDocRef = doc(firestore, 'games', joinedGameId, 'userGameRoles', user.uid);
      const roleData: Omit<UserGameRole, 'id'> = {
        userId: user.uid,
        role: 'Viewer',
        onlineStatus: true,
        lastSeen: serverTimestamp(),
      };
      
      setDoc(roleDocRef, roleData, { merge: true }).catch((error) => {
        const permError = new FirestorePermissionError({
            path: roleDocRef.path,
            operation: 'write',
            requestResourceData: roleData
        });
        errorEmitter.emit('permission-error', permError);
      });

      localStorage.setItem(LOCAL_STORAGE_GAME_ID_KEY, joinedGameId);
      setGameId(joinedGameId);

    } catch (error) {
      const permError = new FirestorePermissionError({
          path: 'games',
          operation: 'list',
          requestResourceData: { gameCode }
      });
      errorEmitter.emit('permission-error', permError);
      setError('Failed to join game.');
    } finally {
      setLoading(false);
    }
  }, [firestore, user]);


  const startGame = useCallback(async (playerNames: { name: string }[], initialCapital: number) => {
    if (!gameId || !user || userGameRole?.role !== 'Banker') {
      setError('Only the Banker can start the game.');
      return;
    }

    const batch = writeBatch(firestore);

    // Update the main game document
    const gameRef = doc(firestore, 'games', gameId);
    batch.update(gameRef, { gameStarted: true, initialCapital });

    // Create player documents
    const playersRef = collection(firestore, 'games', gameId, 'players');
    playerNames.forEach((p, index) => {
      const playerDocRef = doc(playersRef);
      const newPlayer: Omit<Player, 'id'> = {
        name: p.name,
        balance: initialCapital,
        loan: 0,
        round: 1,
        avatarUrl: PlaceHolderImages[index % PlaceHolderImages.length].imageUrl,
      };
      batch.set(playerDocRef, newPlayer);
    });

    batch.commit().catch((error) => {
        const permError = new FirestorePermissionError({
            path: `games/${gameId}`,
            operation: 'write',
            requestResourceData: { gameStarted: true, initialCapital, players: playerNames }
        });
        errorEmitter.emit('permission-error', permError);
        setError("An error occurred while starting the game.");
    });
  }, [firestore, gameId, user, userGameRole]);

  const resetGame = () => {
    localStorage.removeItem(LOCAL_STORAGE_GAME_ID_KEY);
    setGameId(null);
    setGame(null);
    setPlayers([]);
    setTransactions([]);
    setUserGameRole(null);
    setError(null);
  };
  
  const addTransactionToLog = useCallback((batch: any, gameId: string, player: Player, tx: Omit<Transaction, 'id' | 'timestamp' | 'playerId' | 'round' | 'closingBalance'>, closingBalance: number) => {
    const newTx: Omit<Transaction, 'id'> = {
        ...tx,
        timestamp: serverTimestamp(),
        playerId: player.id,
        round: player.round,
        closingBalance: closingBalance
    };
    const txRef = doc(collection(firestore, 'games', gameId, 'transactions'));
    batch.set(txRef, newTx);
  }, [firestore]);


  const performTransaction = useCallback(async (details: {
    fromId: string;
    toId: string;
    amount: number;
    memo: string;
    type: TransactionType;
  }) => {
    if (userGameRole?.role !== 'Banker' || !gameId) {
      toast({ variant: 'destructive', title: 'Viewer Mode', description: 'Only the Banker can perform transactions.' });
      return;
    }
  
    try {
      await runTransaction(firestore, async (transaction) => {
        const { fromId, toId, amount, type, memo } = details;
  
        const fromPlayerRef = fromId !== BANK_PLAYER_ID ? doc(firestore, 'games', gameId, 'players', fromId) : null;
        const toPlayerRef = toId !== BANK_PLAYER_ID ? doc(firestore, 'games', gameId, 'players', toId) : null;
  
        const fromPlayerDoc = fromPlayerRef ? await transaction.get(fromPlayerRef) : null;
        const toPlayerDoc = toPlayerRef ? await transaction.get(toPlayerRef) : null;
  
        const fromPlayer = fromPlayerDoc?.exists() ? fromPlayerDoc.data() as Player : null;
        const toPlayer = toPlayerDoc?.exists() ? toPlayerDoc.data() as Player : null;
  
        const batch = writeBatch(firestore);

        const fromName = fromPlayer?.name ?? 'Bank';
        const toName = toPlayer?.name ?? 'Bank';
  
        switch (type) {
            case 'player-to-player':
                if (fromPlayer && toPlayer && fromPlayerRef && toPlayerRef) {
                    if (fromPlayer.balance < amount) throw new Error(`${fromPlayer.name} has insufficient funds.`);
                    transaction.update(fromPlayerRef, { balance: fromPlayer.balance - amount });
                    transaction.update(toPlayerRef, { balance: toPlayer.balance + amount });
                    addTransactionToLog(batch, gameId, { ...fromPlayer, id: fromId }, { fromId, toId, amount, type, memo }, fromPlayer.balance - amount);
                    addTransactionToLog(batch, gameId, { ...toPlayer, id: toId }, { fromId, toId, amount, type, memo }, toPlayer.balance + amount);
                }
                break;

            case 'pay-bank':
                if (fromPlayer && fromPlayerRef) {
                    if (fromPlayer.balance < amount) throw new Error(`${fromPlayer.name} has insufficient funds.`);
                    transaction.update(fromPlayerRef, { balance: fromPlayer.balance - amount });
                    addTransactionToLog(batch, gameId, { ...fromPlayer, id: fromId }, { fromId, toId, amount, type, memo }, fromPlayer.balance - amount);
                }
                break;

            case 'repay-loan':
                if (fromPlayer && fromPlayerRef) {
                    const repayAmount = Math.min(amount, fromPlayer.loan);
                    if (fromPlayer.balance < repayAmount) throw new Error(`${fromPlayer.name} has insufficient funds to repay ${repayAmount}.`);
                    transaction.update(fromPlayerRef, { balance: fromPlayer.balance - repayAmount, loan: fromPlayer.loan - repayAmount });
                    addTransactionToLog(batch, gameId, { ...fromPlayer, id: fromId }, { fromId, toId, amount: repayAmount, type, memo }, fromPlayer.balance - repayAmount);
                }
                break;

            case 'receive-from-bank':
                if (toPlayer && toPlayerRef) {
                    transaction.update(toPlayerRef, { balance: toPlayer.balance + amount });
                    addTransactionToLog(batch, gameId, { ...toPlayer, id: toId }, { fromId, toId, amount, type, memo }, toPlayer.balance + amount);
                }
                break;

            case 'take-loan':
                if (toPlayer && toPlayerRef) {
                    transaction.update(toPlayerRef, { balance: toPlayer.balance + amount, loan: toPlayer.loan + amount });
                    addTransactionToLog(batch, gameId, { ...toPlayer, id: toId }, { fromId, toId, amount, type, memo }, toPlayer.balance + amount);
                }
                break;
        }

        await batch.commit();

        toast({
            title: 'Transaction Successful',
            description: `${fromName} -> ${toName}: $${amount.toLocaleString()}`,
        });
      });
    } catch (e: any) {
        console.error("Transaction failed: ", e);
        toast({
            variant: "destructive",
            title: "Transaction Failed",
            description: e.message,
        });
    }
  }, [userGameRole, gameId, firestore, toast, addTransactionToLog]);
  

  const passStart = useCallback(async (playerId: string) => {
    if (userGameRole?.role !== 'Banker' || !gameId) {
      toast({ variant: 'destructive', title: 'Viewer Mode', description: 'Only the Banker can perform this action.' });
      return;
    }
  
    try {
      await runTransaction(firestore, async (transaction) => {
        const playerRef = doc(firestore, 'games', gameId, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);
  
        if (!playerDoc.exists()) {
          throw new Error("Player not found.");
        }
  
        const player = playerDoc.data() as Player;
        const nextRound = player.round + 1;
        let newBalance = player.balance + PASS_START_AMOUNT;
        let newLoan = player.loan;

        const batch = writeBatch(firestore);
  
        addTransactionToLog(batch, gameId, { ...player, id: playerId }, { fromId: BANK_PLAYER_ID, toId: playerId, amount: PASS_START_AMOUNT, type: 'pass-start', memo: 'Passed START' }, newBalance);
  
        if (player.loan > 0) {
          const interest = Math.round(player.loan * LOAN_INTEREST_RATE);
          newLoan += interest;
          addTransactionToLog(batch, gameId, { ...player, id: playerId }, { fromId: BANK_PLAYER_ID, toId: playerId, amount: interest, type: 'interest-added', memo: `10% interest on loan` }, newBalance);
        }
  
        transaction.update(playerRef, {
          round: nextRound,
          balance: newBalance,
          loan: newLoan,
        });

        await batch.commit();
  
        toast({
          title: `${player.name} Passed START!`,
          description: `Balance updated and round is now ${nextRound}.`,
        });
      });
    } catch (e: any) {
      console.error("Pass Start failed: ", e);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: e.message,
      });
    }
  }, [userGameRole, gameId, firestore, toast, addTransactionToLog]);


  const value = {
    game,
    players,
    transactions,
    userGameRole,
    gameId,
    error,
    loading: loading || isUserLoading,
    createGame,
    joinGame,
    startGame,
    resetGame,
    performTransaction,
    passStart,
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
