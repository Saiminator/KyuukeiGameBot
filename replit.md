# Overview

Kyuukei is a Discord bot game that implements a "Collect → Train → Lock → Battle" gameplay loop. Players roll for character candidates hourly, select one to train through choose-your-own-adventure style sessions in DMs, then lock finished characters for PvP battles. The system features a web dashboard for monitoring and administration, built with React/TypeScript frontend and Express backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses React with TypeScript and follows a component-based architecture:
- **UI Framework**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with dark theme support and custom color variables
- **State Management**: TanStack Query for server state with custom query client
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production

## Backend Architecture
The server implements a REST API with Express and uses a modular game engine design:
- **Web Framework**: Express.js with TypeScript
- **Game Logic**: Separate engines for core gameplay, training sessions, and PvP battles
- **Content System**: Data-driven content blocks for training scenarios and events
- **Discord Integration**: discord.js client with slash commands and interactive components

## Database & Data Layer
Uses PostgreSQL with Drizzle ORM for type-safe database operations:
- **ORM**: Drizzle with schema-first approach in shared directory
- **Schema**: Comprehensive game data models (users, characters, training, PvP matches)
- **Storage Interface**: Abstract storage layer with in-memory implementation for development
- **Migrations**: Drizzle Kit for schema management

## Game Mechanics
- **Character System**: 8-stat system (Str, Agi, Sta, Mag, Wit, Wil, Cha, Luk) with percentage-based rolling
- **Training System**: Turn-based progression with content blocks defining available actions
- **Character of the Day**: Daily featured character with stat bonuses
- **PvP System**: Battle simulation with item effects and detailed combat logs

## Discord Bot Integration
- **Commands**: Slash commands for rolling, training, and PvP challenges
- **Interactions**: Button and select menu handlers for game actions
- **DM Training**: Private message sessions for character development
- **Server Features**: Public rolling with hourly cooldowns

# External Dependencies

## Core Dependencies
- **Database**: PostgreSQL via Neon Database serverless driver
- **Discord API**: discord.js v14 for bot functionality
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **UI Library**: Radix UI primitives for accessible components
- **Validation**: Zod for runtime type checking and schema validation

## Development Tools
- **Build**: Vite for frontend bundling, esbuild for server compilation
- **TypeScript**: Strict configuration with path mapping
- **Linting**: ESLint configuration for code quality
- **Styling**: PostCSS with Tailwind CSS and autoprefixer

## Runtime Services
- **Environment**: Replit-specific plugins for development features
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Date Handling**: date-fns for date manipulation utilities
- **Utility Libraries**: clsx and class-variance-authority for conditional styling