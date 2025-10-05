'use client';
import { useGame } from '@/contexts/GameContext';
import GameWrapper from '@/components/game/GameWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Landmark } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { gameId, createGame, joinGame, error } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    // When auth is ready and there's no user, sign in anonymously.
    if (!isUserLoading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [isUserLoading, user, auth]);

  if (gameId) {
    return (
      <main>
        <GameWrapper />
      </main>
    );
  }

  const handleJoinGame = () => {
    if (joinCode) {
      joinGame(joinCode);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <Landmark className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="font-headline text-4xl">BizFlow</CardTitle>
            <CardDescription>The Digital Ledger for Business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={createGame}
            className="w-full font-bold"
            disabled={isUserLoading || !user}
          >
            {isUserLoading || !user ? 'Connecting...' : 'Create New Game'}
          </Button>

          <div className="flex items-center gap-4">
            <hr className="w-full" />
            <span className="text-muted-foreground">OR</span>
            <hr className="w-full" />
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter Game Code (e.g., BIZ-ABCD)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="text-center"
            />
            <Button
              onClick={handleJoinGame}
              variant="secondary"
              className="w-full"
              disabled={!joinCode || isUserLoading || !user}
            >
              Join Game
            </Button>
          </div>
          {error && <p className="text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
