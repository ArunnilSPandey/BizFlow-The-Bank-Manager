'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BookOpen } from "lucide-react";
import { useGame } from "@/contexts/GameContext";

export default function Rulebook() {
  const { game } = useGame();

  if (!game) return null;

  const { passStartAmount, loanInterestRate } = game;

  return (
    <Accordion type="single" collapsible className="w-full mb-8">
      <AccordionItem value="item-1">
        <AccordionTrigger>
            <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <h2 className="text-xl font-headline">Game Rulebook</h2>
            </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 text-muted-foreground p-4 bg-secondary/30 rounded-lg">
            <div className="prose">
                <h3 className="font-semibold text-foreground">Passing 'START'</h3>
                <p>
                    Each time a player passes 'START', they will receive <strong>${passStartAmount.toLocaleString()}</strong> from the bank.
                </p>
                <h3 className="font-semibold text-foreground">Loan Interest</h3>
                <p>
                    If a player has an outstanding loan balance when they pass 'START', an interest of <strong>{loanInterestRate * 100}%</strong> will be added to their loan amount.
                </p>
                <h3 className="font-semibold text-foreground">Transactions</h3>
                <p>
                    Only the Banker can perform transactions. This includes player-to-player payments, payments to/from the bank, and managing loans.
                </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
