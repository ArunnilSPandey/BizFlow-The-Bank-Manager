'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Player, TransactionType } from '@/types';
import { useGame } from '@/contexts/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { BANK_PLAYER_ID } from '@/lib/constants';
import { useMemo, useEffect, useRef } from 'react';

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
  memo: z.string().optional(),
  type: z.string().min(1, 'Transaction type is required.'),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: Player | 'bank' | null;
  destination: Player | 'bank' | null;
}

const getTransactionOptions = (sourceId: string, destinationId: string): { value: TransactionType; label: string }[] => {
  if (sourceId !== BANK_PLAYER_ID && destinationId === BANK_PLAYER_ID) {
    return [
      { value: 'pay-bank', label: 'Pay Bank (e.g., Property)' },
      { value: 'repay-loan', label: 'Repay Loan' },
    ];
  }
  if (sourceId === BANK_PLAYER_ID && destinationId !== BANK_PLAYER_ID) {
    return [
      { value: 'receive-from-bank', label: 'Receive from Bank (e.g., Chance)' },
      { value: 'take-loan', label: 'Take Loan' },
    ];
  }
  if (sourceId !== BANK_PLAYER_ID && destinationId !== BANK_PLAYER_ID) {
    return [{ value: 'player-to-player', label: 'Player-to-Player Transfer' }];
  }
  return [];
};


export default function TransactionModal({ isOpen, onClose, source, destination }: TransactionModalProps) {
  const { performTransaction } = useGame();
  const amountInputRef = useRef<HTMLInputElement>(null);

  const sourceId = source === 'bank' ? BANK_PLAYER_ID : source?.id;
  const destinationId = destination === 'bank' ? BANK_PLAYER_ID : destination?.id;

  const transactionOptions = useMemo(() => {
    if (!sourceId || !destinationId) return [];
    return getTransactionOptions(sourceId, destinationId);
  }, [sourceId, destinationId]);

  const defaultTransactionType = useMemo(() => {
    if (!sourceId || !destinationId) return undefined;

    if (sourceId !== BANK_PLAYER_ID && destinationId === BANK_PLAYER_ID) {
      return 'pay-bank';
    }
    if (sourceId === BANK_PLAYER_ID && destinationId !== BANK_PLAYER_ID) {
      return 'receive-from-bank';
    }
    if (transactionOptions.length === 1) {
      return transactionOptions[0].value;
    }
    return undefined;
  }, [sourceId, destinationId, transactionOptions]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 0, memo: '' },
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      form.reset({
        amount: 0,
        memo: '',
        type: defaultTransactionType
      });
      // Add a small delay to ensure the input is rendered and focusable
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultTransactionType, form]);


  const onSubmit = (values: FormValues) => {
    if (!sourceId || !destinationId) return;
    performTransaction({
      fromId: sourceId,
      toId: destinationId,
      amount: values.amount,
      memo: values.memo || 'Transaction',
      type: values.type as TransactionType,
    });
    onClose();
  };
  
  const sourceName = source === 'bank' ? 'Bank' : source?.name;
  const destinationName = destination === 'bank' ? 'Bank' : destination?.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">New Transaction</DialogTitle>
          <DialogDescription>
            From <span className="font-bold text-primary">{sourceName}</span> to <span className="font-bold text-primary">{destinationName}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transactionOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} ref={amountInputRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Rent for Boardwalk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Confirm Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
