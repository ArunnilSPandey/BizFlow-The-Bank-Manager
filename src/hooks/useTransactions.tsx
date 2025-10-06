'use client';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import type { Transaction } from '@/types';

export const useTransactions = (gameId: string | null) => {
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!gameId) return null;
        return query(
            collection(firestore, 'games', gameId, 'transactions'),
            orderBy('timestamp', 'desc')
        );
    }, [gameId, firestore]);

    const { data: transactions, isLoading, error } = useCollection<Transaction>(transactionsQuery);

    return transactions || [];
};
