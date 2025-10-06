'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  passStartAmount: z.coerce.number().min(0, 'Must be a positive number.'),
  loanInterestRate: z.coerce.number().min(0, 'Must be 0 or greater.').max(1, 'Must be between 0 and 1 (e.g., 0.1 for 10%).'),
});

type FormValues = z.infer<typeof formSchema>;

export default function BankerSettings() {
  const { game, updateGameSettings } = useGame();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passStartAmount: game?.passStartAmount || 2000,
      loanInterestRate: game?.loanInterestRate || 0.10,
    },
  });
  
  // Reset form when game data changes
  useEffect(() => {
    if (game) {
      form.reset({
        passStartAmount: game.passStartAmount,
        loanInterestRate: game.loanInterestRate,
      });
    }
  }, [game, form]);


  const onSubmit = async (values: FormValues) => {
    try {
        await updateGameSettings(values);
        toast({ title: "Settings Saved", description: "The game rules have been updated." });
    } catch(e) {
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save settings." });
    }
  };

  if (!game) return null;

  return (
    <Card className="w-full mb-8 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Settings /> Banker Controls</CardTitle>
        <CardDescription>Adjust core game rules. Changes will apply immediately.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <FormField
              control={form.control}
              name="passStartAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>'Pass START' Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="loanInterestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Interest Rate (e.g., 0.1 for 10%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="font-bold w-full md:w-auto">
                <Save className="mr-2" /> Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
