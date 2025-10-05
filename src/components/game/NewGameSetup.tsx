'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Trash2, UserPlus, Users } from 'lucide-react';

const formSchema = z.object({
  initialCapital: z.coerce.number().min(1, 'Initial capital must be positive.'),
  players: z.array(z.object({ name: z.string().min(1, 'Player name is required.') }))
    .min(2, 'At least 2 players are required.')
    .max(8, 'A maximum of 8 players are allowed.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewGameSetup() {
  const { startGame, game } = useGame();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialCapital: game?.initialCapital || 15000,
      players: [{ name: '' }, { name: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'players',
  });

  const onSubmit = (values: FormValues) => {
    startGame(values.players, values.initialCapital);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center">
            <Landmark className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="font-headline text-4xl">Game Setup</CardTitle>
          <CardDescription>Configure the players and starting money.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="initialCapital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Capital ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="flex items-center gap-2 mb-2"><Users className="h-4 w-4" /> Players</Label>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`players.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormControl>
                              <Input placeholder={`Player ${index + 1} Name`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 2}
                        aria-label="Remove player"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: '' })}
                  disabled={fields.length >= 8}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add Player
                </Button>
                <Button type="submit" className="font-bold">Start Game</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
