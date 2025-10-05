'use client';
import { useGame } from '@/contexts/GameContext';
import NewGameSetup from './NewGameSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, PartyPopper, Users, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserPresence from './UserPresence';

export default function GameLobby() {
    const { game, userGameRole, players } = useGame();
    const { toast } = useToast();
    const isBanker = userGameRole?.role === 'Banker';

    if (!game) {
        return <div>Loading...</div>; // Or some other loading state
    }

    const copyGameCode = () => {
        if (game?.gameCode) {
            navigator.clipboard.writeText(game.gameCode);
            toast({
                title: "Game Code Copied!",
                description: `You can now share "${game.gameCode}" with other players.`,
            });
        }
    }

    // If game has started, show dashboard
    if (game.gameStarted) {
        return <NewGameSetup />;
    }

    // If game has not started, show lobby
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg mx-auto shadow-2xl text-center">
                <CardHeader>
                    <Landmark className="mx-auto h-12 w-12 text-primary" />
                    <CardTitle className="font-headline text-4xl">Game Lobby</CardTitle>
                    <CardDescription>Waiting for the Banker to start the game.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-center gap-4">
                        <p className="text-2xl font-mono p-3 bg-muted rounded-md tracking-widest">
                            {game.gameCode}
                        </p>
                        <Button variant="outline" size="icon" onClick={copyGameCode}>
                            <Copy />
                        </Button>
                    </div>

                    <div className="text-left">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                           <Users/> Players in Lobby
                        </h3>
                        <UserPresence />
                    </div>

                    {isBanker ? (
                        <NewGameSetup />
                    ) : (
                        <p className="text-muted-foreground p-4 bg-accent rounded-md">
                            Once the Banker starts the game, the player dashboard will appear here.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
