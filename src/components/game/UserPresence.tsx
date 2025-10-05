'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useGame } from '@/contexts/GameContext';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import type { UserGameRole } from '@/types';

export default function UserPresence() {
    const firestore = useFirestore();
    const { gameId } = useGame();
    const [userRoles, setUserRoles] = useState<UserGameRole[]>([]);

    useEffect(() => {
        if (!gameId) return;

        const rolesRef = collection(firestore, 'games', gameId, 'userGameRoles');
        const unsubscribe = onSnapshot(rolesRef, (snapshot: QuerySnapshot<DocumentData>) => {
            const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserGameRole));
            setUserRoles(roles);
        });

        return () => unsubscribe();
    }, [gameId, firestore]);

    const bankerCount = userRoles.filter(r => r.role === 'Banker').length;
    const viewerCount = userRoles.filter(r => r.role === 'Viewer').length;

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <Users className="h-4 w-4" />
           <Badge variant="outline">Bankers: {bankerCount}</Badge>
           <Badge variant="outline">Viewers: {viewerCount}</Badge>
        </div>
    );
}
