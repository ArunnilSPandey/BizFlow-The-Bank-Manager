'use client';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import type { Player } from '@/types';

export const usePlayers = (gameId: string | null) => {
    const firestore = useFirestore();

    const playersQuery = useMemoFirebase(() => {
        if (!gameId) return null;
        return query(collection(firestore, 'games', gameId, 'players'));
    }, [gameId, firestore]);

    const { data: players, isLoading, error } = useCollection<Player>(playersQuery);

    return players || [];
};
