'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BANK_PLAYER_ID } from '@/lib/constants';

interface BankCardProps {
    onDragStart: () => void;
    onDragEnd: () => void;
    onDrop: (destinationId: string) => void;
    onClick: () => void;
    isDragging: boolean;
    isSelected: boolean;
    isDropTarget: boolean;
}

export default function BankCard({ onDragStart, onDragEnd, onDrop, onClick, isDragging, isSelected, isDropTarget }: BankCardProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (isDropTarget) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(BANK_PLAYER_ID);
    };

    return (
        <Card
            draggable
            onClick={onClick}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', BANK_PLAYER_ID);
                onDragStart();
            }}
            onDragEnd={onDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                'flex flex-col items-center justify-center text-center p-6 bg-secondary transition-shadow duration-200 ease-in-out cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl',
                (isDragOver || (isDropTarget && isSelected)) && 'ring-2 ring-primary ring-offset-2',
                isDragging && 'opacity-50',
                isSelected && 'shadow-2xl ring-2 ring-blue-500 ring-offset-2'
            )}
        >
            <CardHeader className="p-0">
                <Landmark className="h-20 w-20 text-primary" />
            </CardHeader>
            <CardContent className="p-0 mt-4">
                <CardTitle className="font-headline text-3xl">The Bank</CardTitle>
            </CardContent>
        </Card>
    );
}
