# TechMandates

## Project Overview

A modern web application for managing technical mandates and requirements, built with React, TypeScript, and Tailwind CSS.

## Database Setup

This project now uses **SQLite** for local data storage instead of Supabase. This provides a self-contained development environment with no external dependencies.

### Quick Start with SQLite

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize the database**:
   ```bash
   npm run migrate:sqlite
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

### Migration from Supabase

If you're migrating from Supabase, see the [Migration Guide](MIGRATION_GUIDE.md) for detailed instructions.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

Clone this repo and work locally with your own IDE. The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

You can deploy this project to any hosting platform that supports static sites or Node.js applications, such as:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

Follow the deployment instructions for your chosen platform.
