# Zentric – AI Growth Operating System

A production-ready full-stack AI-powered productivity platform for students, developers, job seekers, and professionals.

## Features

- **Dashboard** – Productivity score, task overview, goals, AI suggestions
- **Task Planner** – Create, edit, filter, and track tasks with priorities & deadlines
- **Study Tracker** – Track DSA topics, LeetCode progress, and learning goals
- **Notes** – Rich note-taking with search, tags, and auto-save
- **AI Chat** – Streaming GPT-4o-mini chat with conversation history and markdown support
- **Agent Architecture** – 7 specialized AI agents (Planner, Study, Coding, Research, Career, Automation, Orchestrator)
- **Authentication** – NextAuth with credentials (email-based, no password required for demo)
- **Settings** – Profile, API key management, theme preferences

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI + custom components |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Auth | NextAuth v5 (beta) |
| AI | OpenAI API (GPT-4o-mini) |
| Deployment | Vercel-compatible |

## Quick Start

### 1. Clone and install

```bash
cd zentric
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `NEXTAUTH_SECRET` – any random string (use `openssl rand -base64 32`)
- `OPENAI_API_KEY` – your OpenAI API key (optional, app works without it)

### 3. Set up database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Sign in

Enter any email address to sign in (no password required in demo mode).

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated app routes
│   │   ├── layout.tsx            # Auth guard + sidebar layout
│   │   ├── dashboard/page.tsx    # Dashboard with stats & widgets
│   │   ├── planner/page.tsx      # Task planner
│   │   ├── study/page.tsx        # Study tracker
│   │   ├── notes/page.tsx        # Notes editor
│   │   ├── chat/page.tsx         # AI chat interface
│   │   ├── agents/page.tsx       # Agent architecture showcase
│   │   └── settings/page.tsx     # Settings & profile
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── dashboard/            # Dashboard stats API
│   │   ├── tasks/                # Tasks CRUD API
│   │   ├── study/                # Study topics CRUD API
│   │   ├── notes/                # Notes CRUD API
│   │   ├── conversations/        # Conversations API
│   │   ├── chat/                 # OpenAI streaming chat API
│   │   └── settings/             # User settings API
│   ├── auth/signin/page.tsx      # Sign in page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Root redirect
├── agents/
│   └── index.ts                  # Agent architecture (7 agents)
├── components/
│   ├── layout/
│   │   └── sidebar.tsx           # Navigation sidebar
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   └── providers.tsx             # SessionProvider wrapper
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Utility functions
└── types/
    └── index.ts                  # TypeScript type definitions

prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # Database migrations
```

## Database Schema

- **User** – Accounts, sessions, profile
- **Task** – Tasks with priority, deadline, completion
- **Goal** – Progress tracking goals
- **StudyTopic** – DSA/LeetCode topic tracking
- **Note** – Notes with tags
- **Conversation** + **Message** – AI chat history
- **UserSettings** – Theme, API keys, profile

## AI Agent Architecture

Seven specialized agents built on a base class pattern:

| Agent | Purpose |
|-------|---------|
| **OrchestratorAgent** | Routes tasks to specialized agents |
| **PlannerAgent** | Task breakdown & schedule optimization |
| **StudyAgent** | Learning paths & DSA guidance |
| **CodingAgent** | Code review & problem solving |
| **ResearchAgent** | Topic research & resource discovery |
| **CareerAgent** | Resume review & interview prep |
| **AutomationAgent** | Reports & scheduled workflows |

Each agent has defined `capabilities`, `run()`, and `stop()` methods ready for OpenAI function calling integration.

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL` → PostgreSQL connection string (Vercel Postgres, PlanetScale, etc.)
- `NEXTAUTH_SECRET` → Random secret
- `NEXTAUTH_URL` → Your production URL
- `OPENAI_API_KEY` → Your OpenAI key

## Migration to PostgreSQL

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

Update `prisma.config.ts` with your PostgreSQL URL, then run:

```bash
npx prisma migrate deploy
```

## License

MIT
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
