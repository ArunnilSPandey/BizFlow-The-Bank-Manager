# BizFlow: Digital Ledger for Business Board Games 🎲

![Framework](https://img.shields.io/badge/Framework-Next.js-black.svg)
![Language](https://img.shields.io/badge/Language-TypeScript-blue.svg)
![Database](https://img.shields.io/badge/Database-Firebase-orange.svg)
![Deployment](https://img.shields.io/badge/Deployment-Firebase_Hosting-yellow.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

BizFlow is a digital ledger application designed to eliminate the hassle of manual bookkeeping in business-style board games. It provides a simple, intuitive interface for managing player finances, with customizable game rules and real-time data synchronization. The Banker can set unique game parameters, players can transact with ease, and spectators can watch the action unfold live.

<img width="1916" height="865" alt="image" src="https://github.com/user-attachments/assets/c253ed75-de59-4db7-8f3a-68a3c1f5299b" />

<img width="1896" height="861" alt="image" src="https://github.com/user-attachments/assets/3038a8e5-8272-4f6d-89d8-f707c6a68c17" />

<img width="1878" height="863" alt="image" src="https://github.com/user-attachments/assets/56059dae-e5ec-467c-abab-c959e0967047" />

<img width="1897" height="863" alt="image" src="https://github.com/user-attachments/assets/eb3ab22a-972c-4215-acb7-014abeb05eb3" />


``

## 🚀 Live Demo

**Check out the live application here:** `https://bizflow-the-game.web.app/`
**Static/Non-backend version:** `https://login-4bf38.web.app/`

***

## ✨ Key Features

* **🎮 Flexible Game Setup**: Configure new games with custom player names, and allow the Banker to set the starting capital and loan interest rate.
* **💳 Interactive Player Cards**: View each player's current financial status and the game's round number at a glance.
* **💸 Drag-and-Drop Transactions**: Effortlessly initiate transactions between players or with the bank.
* **🏦 Dynamic Loan System**: Manage loans with an automatic interest calculation based on the rate set by the Banker.
* **🔒 Transaction Validation**: Secure backend rules in Firestore prevent players from spending more money than they have.
* **📜 Detailed History**: Review a round-by-round transaction history for each player to track financial movements.
* **👀 Spectator Mode**: Allows users to join and view a game's progress in real-time without participating.
* **🔄 Real-time Sync**: Utilizes Firebase Firestore to ensure all game data is synchronized instantly across all devices.

***

## 🛠️ Tech Stack

* **Framework**: [Next.js](https://nextjs.org/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Database & Hosting**: [Firebase](https://firebase.google.com/) (Firestore, Authentication, Hosting)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)

***

## ⚙️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* **Node.js**: Make sure you have the LTS version of Node.js installed. You can download it [here](https://nodejs.org/).
* **Firebase Account**: You'll need a free Firebase account. Create one [here](https://firebase.google.com/).
* **Firebase CLI**: Install the Firebase command-line tools globally.
    ```bash
    npm install -g firebase-tools
    ```

### Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/BizFlow.git](https://github.com/your-username/BizFlow.git)
    cd BizFlow
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set Up Firebase**
    * Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    * In your project dashboard, click the web icon (`</>`) to add a new web app.
    * Follow the setup steps and copy the `firebaseConfig` object.

4.  **Create Environment File**
    * In the root of the project, create a file named `.env.local`.
    * Paste your Firebase configuration keys into this file. It should look like this:

    ```env
    # .env.local
    NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    ```

### Running the Development Server

Start the local development server with this command:
```bash

Open your browser and navigate to `http://localhost:3000` to see the application running.

***

## ☁️ Deployment

This project is configured for easy deployment to **Firebase Hosting**.

1.  **Log in to Firebase** (if you haven't already):
    ```bash
    firebase login
    ```

2.  **Initialize Firebase** in your project directory (if you haven't already):
    ```bash
    firebase init
    ```
    * When prompted, select **Hosting: Configure files for Firebase Hosting...**.
    * Choose to **Use an existing project** and select your Firebase project.
    * When prompted for your public directory, enter `.` (a single period).
    * Answer **No** to "Configure as a single-page app".

3.  **Build and Deploy**
    * First, create a production-ready build of your application:
        ```bash
        npm run build
        ```
    * Then, deploy the build to Firebase Hosting:
        ```bash
        firebase deploy
        ```
    After deployment, the CLI will provide you with the URL to your live application!

***


