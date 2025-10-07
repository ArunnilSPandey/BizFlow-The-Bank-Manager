BizFlow - Digital Ledger for Business Board Games
Project Overview
BizFlow is a digital ledger application designed for business board games. It simplifies financial tracking with the following features:

Game Setup: Configure new games with custom player names and starting capital
Interactive Player/Bank Cards: Display each player's financial status and round number
Drag-and-Drop Transactions: Initiate transactions between players and the bank
Loan System: Manage loans with automatic 10% interest calculation
Transaction History: View detailed player transaction history grouped by round
Real-time Sync: Utilizes Firebase for real-time data synchronization across devices
Complete Deployment Guide
This guide will walk you through setting up the development environment and deploying BizFlow to Firebase Hosting.

Prerequisites
A computer running Windows, macOS, or Linux
Basic knowledge of command-line interfaces
A Firebase account (free tier works for initial deployment)
Step 1: Install Node.js and npm
Download Node.js:

Visit https://nodejs.org/
Download the LTS (Long Term Support) version
Run the installer and follow the installation prompts
Accept the default installation settings
Verify the installation:

These commands should display the installed versions of Node.js and npm.

Step 2: Clone and Set Up the Project
Clone the repository (or download and extract if you have it as a ZIP):

Install project dependencies:

This will install all the dependencies listed in package.json.

Step 3: Run the Project Locally
Start the development server:

Open the application in your browser:

Test the application to ensure everything works correctly.

Step 4: Create a Firebase Project
Go to Firebase Console:

Visit https://console.firebase.google.com/
Sign in with your Google account
Create a new project:

Click "Add project"
Enter a project name (e.g., "bizflow-the-game")
Choose whether to enable Google Analytics (recommended)
Click "Create project"
Register your app with Firebase:

From the project overview page, click the web icon (</>) to add a web app
Enter an app nickname (e.g., "BizFlow")
Check "Also set up Firebase Hosting" if prompted
Click "Register app"
Note your Firebase configuration:

Firebase will display configuration details
This information is already in your project at config.ts, but you may need to update it
Step 5: Install Firebase CLI
Install Firebase CLI globally:

Log in to Firebase:

This will open a browser window where you'll authorize the CLI with your Google account.

Step 6: Initialize Firebase in Your Project
Initialize Firebase:

Select features: When prompted "Which Firebase features do you want to set up for this directory?", use the arrow keys and space bar to select:

Press Enter to continue.

Project selection:

Select "Use an existing project"
Choose your Firebase project from the list (e.g., "bizflow-the-game")
Hosting setup:

What do you want to use as your public directory? Enter . (just a period) to use the project root
Configure as a single-page app? Answer No
Set up automatic builds and deploys with GitHub? Choose based on your preference (typically No for first setup)
File firebase.json already exists. Overwrite? Answer No to keep your existing configuration
Step 7: Configure Firebase for Next.js
Create or update firebase.json (it should match this configuration):

This configuration is crucial for Next.js applications, particularly the frameworksBackend setting.

Verify .firebaserc file has the correct project ID:

Replace your-firebase-project-id with your actual Firebase project ID.

Create apphosting.yaml if it doesn't exist:

Step 8: Build Your Application
Build the application:

This will create an optimized production build of your application.

Verify the build was successful (you should see a success message).

Step 9: Deploy to Firebase
Deploy your application:

Watch the deployment progress in your terminal.

On successful deployment, you'll see a message with:

Hosting URL: https://your-project-id.web.app
Console URL: Link to Firebase console
Step 10: Test Your Deployed Application
Visit your deployed application using the Hosting URL provided.

Test all features to ensure they work correctly in the production environment.

Step 11: Set Up Firebase Authentication (Optional)
Go to your Firebase console.

Enable Authentication:

Click on "Authentication" in the left sidebar
Click "Get started"
Enable the authentication methods you need (e.g., Anonymous, Email/Password)
Step 12: Set Up Firestore Database (Optional)
Go to your Firebase console.

Create Firestore Database:

Click on "Firestore Database" in the left sidebar
Click "Create database"
Start in production mode (or test mode for development)
Choose a database location closest to your users
Troubleshooting
Firebase initialization errors during build:

These warnings are normal during build and won't affect production
The initialization code handles both local and production environments
"Page Not Found" after deployment:

Ensure your firebase.json contains the correct configuration with source and frameworksBackend
Check your Firebase console for any deployment errors
Authentication or database access issues:

Verify Firebase Authentication is enabled for the methods you're using
Check Firestore security rules in the Firebase Console
Updating Your Deployed Application
Make changes to your code.

Rebuild the application:

Redeploy:

Managing Your Application
Firebase Console: Visit https://console.firebase.google.com/ to manage your project, view analytics, and monitor performance.

Adding Custom Domain: In the Firebase Hosting section, click "Add custom domain" to connect your own domain name.

Security Rules: Set up appropriate security rules for Firestore to protect your data.

Now your BizFlow application is fully deployed and ready to use! Share the URL with your users to start tracking game finances with ease.