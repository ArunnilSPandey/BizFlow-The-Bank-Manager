# **App Name**: BizFlow

## Core Features:

- Game Setup: Configure new game with player names and starting capital.
- Interactive Player/Bank Cards: Display each player's name, balance, and round number, along with a Bank 'card'.
- Drag-and-Drop Transactions: Initiate transactions by dragging and dropping player/bank cards onto one another.
- Transaction Modal: Display a context-aware modal/popup to specify transaction details (amount, memo, type) based on source and destination.
- Loan System and Calculation: Manage loans, and automatically calculate and apply 10% interest upon 'Pass START'.
- Detailed Transaction History: Display player-specific transaction history, grouped by round number, with visual indicators and clear descriptions.
- Real-time Data Sync: Uses Firebase Firestore to store/persist game data and ensure all players see real-time updates.

## Style Guidelines:

- Primary color: Deep Yellow (#D4A800) to capture the vintage nature of the game without copying well-worn aesthetics.
- Background color: Off-White (#F2F0EB) with only 15% saturation.
- Accent color: Deep Red (#A62900) to indicate important information (warnings, errors) without creating any specific emotions
- Headline font: 'Playfair', serif, for headlines or small amounts of text. Body Font: 'PT Sans', sans-serif, for the rest of the UI.
- Use icons with flow indicators, leveraging the 'feel of a classic board game.'
- Cards should be large and easily draggable, for seamless mobile interactions.
- Employ subtle animations and transitions to enhance the drag-and-drop interactions.