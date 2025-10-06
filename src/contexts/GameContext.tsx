'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { Game, Player, Transaction, UserGameRole } from '@/types';
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
  exitGame: () => void;
  updateGameSettings: (settings: { passStartAmount?: number; loanInterestRate?: number }) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const LOCAL_STORAGE_GAME_ID_KEY = 'bizflow_gameId';

export function GameProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

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
        exitGame(); // Game was deleted or does not exist.
      }
    }, (e) => {
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
    
    const gameData = {
      gameCode,
      initialCapital: 15000,
      gameStarted: false,
      createdAt: new Date(),
      passStartAmount: 2000,
      loanInterestRate: 0.10,
    };
    
    const roleData = {
        userId: user.uid,
        role: 'Banker',
        onlineStatus: true,
        lastSeen: new Date(),
    };

    try {
      const newGameRef = await addDoc(collection(firestore, 'games'), gameData);
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
      const roleData = {
        userId: user.uid,
        role: 'Viewer',
        onlineStatus: true,
        lastSeen: new Date(),
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
    // This is now handled in lib/transactions.ts
  }, [gameId, user, userGameRole]);

  const exitGame = () => {
    localStorage.removeItem(LOCAL_STORAGE_GAME_ID_KEY);
    setGameId(null);
    setGame(null);
    setPlayers([]);
    setTransactions([]);
    setUserGameRole(null);
    setError(null);
  };
  
  const updateGameSettings = useCallback(async (settings: { passStartAmount?: number; loanInterestRate?: number }) => {
    if (!gameId || userGameRole?.role !== 'Banker') return;

    const gameRef = doc(firestore, 'games', gameId);
    try {
      await updateDoc(gameRef, settings);
    } catch (e) {
      const permError = new FirestorePermissionError({
        path: gameRef.path,
        operation: 'update',
        requestResourceData: settings,
      });
      errorEmitter.emit('permission-error', permError);
    }
  }, [gameId, userGameRole, firestore]);


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
    exitGame,
    updateGameSettings,
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
