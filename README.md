# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b01be3af-b0a1-4c9d-a930-35e39397d8e5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b01be3af-b0a1-4c9d-a930-35e39397d8e5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

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

## Local Development Setup

To run the application locally, you'll need to start both the main application and the proxy server:

### 1. Start the Main Application

```sh
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The main application will be available at `http://localhost:5173` (or the port shown in your terminal).

### 2. Start the Simple Proxy Server

In a separate terminal window/tab, start the proxy server:

```sh
# Start the simple proxy server
node simple-proxy.js
```

The proxy server will handle API requests and CORS issues for the application.

**Note**: Both servers need to be running simultaneously for the application to work properly.

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

Simply open [Lovable](https://lovable.dev/projects/b01be3af-b0a1-4c9d-a930-35e39397d8e5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
