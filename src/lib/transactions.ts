'use client';
import {
  doc,
  runTransaction,
  collection,
  writeBatch,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import type { Player, Transaction, TransactionType } from '@/types';
import { BANK_PLAYER_ID } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const addTransactionToLog = (
    batch: any, 
    firestore: Firestore, 
    gameId: string, 
    player: Player | { id: string, round: number }, 
    tx: Omit<Transaction, 'id' | 'timestamp' | 'playerId' | 'round' | 'closingBalance'>, 
    closingBalance: number
) => {
    const newTx: Omit<Transaction, 'id'> = {
        ...tx,
        timestamp: serverTimestamp() as any,
        playerId: player.id,
        round: player.round,
        closingBalance: closingBalance
    };
    const txRef = doc(collection(firestore, 'games', gameId, 'transactions'));
    batch.set(txRef, newTx);
};


export const performTransaction = async (
  firestore: Firestore,
  gameId: string,
  details: {
    fromId: string;
    toId: string;
    amount: number;
    memo: string;
    type: TransactionType;
  }
) => {
    try {
        const batch = writeBatch(firestore);

        await runTransaction(firestore, async (transaction) => {
            const { fromId, toId, amount, type, memo } = details;
    
            const fromPlayerRef = fromId !== BANK_PLAYER_ID ? doc(firestore, 'games', gameId, 'players', fromId) : null;
            const toPlayerRef = toId !== BANK_PLAYER_ID ? doc(firestore, 'games', gameId, 'players', toId) : null;
    
            const fromPlayerDoc = fromPlayerRef ? await transaction.get(fromPlayerRef) : null;
            const toPlayerDoc = toPlayerRef ? await transaction.get(toPlayerRef) : null;
    
            const fromPlayer = fromPlayerDoc?.exists() ? fromPlayerDoc.data() as Player : null;
            const toPlayer = toPlayerDoc?.exists() ? toPlayerDoc.data() as Player : null;

            switch (type) {
                case 'player-to-player':
                    if (fromPlayer && toPlayer && fromPlayerRef && toPlayerRef) {
                        if (fromPlayer.balance < amount) throw new Error(`${fromPlayer.name} has insufficient funds.`);
                        transaction.update(fromPlayerRef, { balance: fromPlayer.balance - amount });
                        transaction.update(toPlayerRef, { balance: toPlayer.balance + amount });
                        addTransactionToLog(batch, firestore, gameId, { ...fromPlayer, id: fromId }, { fromId, toId, amount, type, memo }, fromPlayer.balance - amount);
                        addTransactionToLog(batch, firestore, gameId, { ...toPlayer, id: toId }, { fromId, toId, amount, type, memo }, toPlayer.balance + amount);
                    }
                    break;

                case 'pay-bank':
                    if (fromPlayer && fromPlayerRef) {
                        if (fromPlayer.balance < amount) throw new Error(`${fromPlayer.name} has insufficient funds.`);
                        transaction.update(fromPlayerRef, { balance: fromPlayer.balance - amount });
                        addTransactionToLog(batch, firestore, gameId, { ...fromPlayer, id: fromId }, { fromId, toId, amount, type, memo }, fromPlayer.balance - amount);
                    }
                    break;

                case 'repay-loan':
                    if (fromPlayer && fromPlayerRef) {
                        const repayAmount = Math.min(amount, fromPlayer.loan);
                        if (fromPlayer.balance < repayAmount) throw new Error(`${fromPlayer.name} has insufficient funds to repay ${repayAmount}.`);
                        transaction.update(fromPlayerRef, { balance: fromPlayer.balance - repayAmount, loan: fromPlayer.loan - repayAmount });
                        addTransactionToLog(batch, firestore, gameId, { ...fromPlayer, id: fromId }, { fromId, toId, amount: repayAmount, type, memo }, fromPlayer.balance - repayAmount);
                    }
                    break;

                case 'receive-from-bank':
                    if (toPlayer && toPlayerRef) {
                        transaction.update(toPlayerRef, { balance: toPlayer.balance + amount });
                        addTransactionToLog(batch, firestore, gameId, { ...toPlayer, id: toId }, { fromId, toId, amount, type, memo }, toPlayer.balance + amount);
                    }
                    break;

                case 'take-loan':
                    if (toPlayer && toPlayerRef) {
                        transaction.update(toPlayerRef, { balance: toPlayer.balance + amount, loan: toPlayer.loan + amount });
                        addTransactionToLog(batch, firestore, gameId, { ...toPlayer, id: toId }, { fromId, toId, amount, type, memo }, toPlayer.balance + amount);
                    }
                    break;
            }
        });
        
        // Commit the batch of transaction logs outside the atomic transaction
        await batch.commit();

    } catch (e: any) {
        const permError = new FirestorePermissionError({
            path: `games/${gameId}/players`,
            operation: 'write',
            requestResourceData: details,
        });
        errorEmitter.emit('permission-error', permError);
        // Re-throw the original error to be caught by the UI
        throw e;
    }
};

export const passStart = async (
  firestore: Firestore,
  gameId: string,
  playerId: string,
  passStartAmount: number,
  loanInterestRate: number,
) => {
    try {
        const batch = writeBatch(firestore);

        await runTransaction(firestore, async (transaction) => {
            const playerRef = doc(firestore, 'games', gameId, 'players', playerId);
            const playerDoc = await transaction.get(playerRef);

            if (!playerDoc.exists()) {
                throw new Error("Player not found.");
            }

            const player = playerDoc.data() as Player;
            const nextRound = player.round + 1;
            let newBalance = player.balance + passStartAmount;
            let newLoan = player.loan;

            addTransactionToLog(batch, firestore, gameId, { ...player, id: playerId }, { fromId: BANK_PLAYER_ID, toId: playerId, amount: passStartAmount, type: 'pass-start', memo: 'Passed START' }, newBalance);

            if (player.loan > 0) {
                const interest = Math.round(player.loan * loanInterestRate);
                newLoan += interest;
                addTransactionToLog(batch, firestore, gameId, { ...player, id: playerId }, { fromId: BANK_PLAYER_ID, toId: playerId, amount: interest, type: 'interest-added', memo: `${loanInterestRate * 100}% interest on loan` }, newBalance);
            }

            transaction.update(playerRef, {
                round: nextRound,
                balance: newBalance,
                loan: newLoan,
            });
        });

        // Commit the batch of transaction logs outside the atomic transaction
        await batch.commit();

    } catch (e: any) {
        const permError = new FirestorePermissionError({
            path: `games/${gameId}/players/${playerId}`,
            operation: 'update',
        });
        errorEmitter.emit('permission-error', permError);
        throw e;
    }
};
