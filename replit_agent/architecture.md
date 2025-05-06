# Architecture Overview

## 1. Overview

The application is a volleyball player management and match tracking system built with a modern web stack. It's designed as a full-stack application with a clear separation between client and server components. The system appears to be an arcade-style volleyball game simulation with player stats, ratings, and match history tracking.

Key features include:
- Player selection and team formation
- Match creation and tracking
- Real-time game scoring
- Player ratings and leaderboards
- Admin configuration for rating settings
- Game history tracking

The application is styled with an arcade-inspired retro UI, with pixel art aesthetics and custom styling for visual appeal.

## 2. System Architecture

The application follows a client-server architecture with:

1. **Frontend**: React-based single-page application with a component-based architecture using shadcn/ui components
2. **Backend**: Express.js server with RESTful API endpoints
3. **Database**: PostgreSQL database managed through Drizzle ORM
4. **Build/Dev Tools**: Vite for frontend bundling and TypeScript for type safety

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Client (React)   │◄────┤  Server (Express) │◄────┤  Database (Neon)  │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

### Key Architectural Decisions:

1. **Monorepo Structure**: The project uses a monorepo approach with client, server, and shared code in a single repository, allowing for code sharing and simpler deployment.

2. **Type Safety**: TypeScript is used throughout the application for type safety and improved developer experience.

3. **Shared Schema**: Database schema definitions are kept in a shared directory to ensure type consistency between client and server.

4. **Component Library**: The application uses shadcn/ui, a collection of reusable UI components, for rapid development and consistent styling.

5. **Database Access**: Drizzle ORM is used with Neon PostgreSQL, providing type-safe database access and schema management.

## 3. Key Components

### Frontend Components

1. **Pages**:
   - `SelectionScreen`: Player selection interface for forming teams
   - `MatchScreen`: Real-time match gameplay and scoring
   - `ResultScreen`: Match results and statistics
   - `LeaderboardScreen`: Player rankings and statistics
   - `AdminScreen`: Rating system configuration
   - `GameHistoryScreen`: Historical match records

2. **UI Components**:
   - Custom arcade-styled UI components (pixel borders, chrome text)
   - Player cards and team sections
   - Match scoring interface
   - Leaderboard displays

3. **State Management**:
   - React Query for server state management and data fetching
   - React hooks for local component state

### Backend Components

1. **API Routes**:
   - Player management endpoints
   - Match creation and tracking
   - Game logs and history
   - Rating system configuration

2. **Services**:
   - `Storage`: Data access layer interfacing with the database
   - `RatingEngine`: Player rating calculation system (likely Glicko-based)

3. **Database Schema**:
   - `users`: Authentication and user management
   - `players`: Volleyball player profiles and statistics
   - `matches`: Match records and outcomes
   - `sets`: Individual set data within matches
   - `gameLogs`: Timeline of events within matches

## 4. Data Flow

1. **Player Selection Flow**:
   - Client fetches players from the server
   - Users select players for both east and west teams
   - Selection is submitted to create a new match

2. **Match Gameplay Flow**:
   - Match screen loads match data and player information
   - Score updates are sent to the server
   - Game events are logged as they occur
   - Match completion triggers rating updates

3. **Rating System Flow**:
   - Player ratings are updated after match completion
   - Rating calculations consider match outcome and performance
   - Daily bonus points may be allocated to players

4. **Leaderboard Flow**:
   - Player statistics and ratings are retrieved from the database
   - Data is processed to calculate win rates and rankings
   - Information is displayed in a sortable leaderboard

## 5. External Dependencies

### Frontend Dependencies

1. **UI Framework**: React with shadcn/ui components
2. **Routing**: Wouter for lightweight client-side routing
3. **Data Fetching**: TanStack Query (React Query) for data fetching and caching
4. **Styling**: Tailwind CSS for utility-first styling
5. **Form Handling**: React Hook Form with Zod validation
6. **Date Handling**: date-fns for date manipulation

### Backend Dependencies

1. **Server Framework**: Express.js
2. **Database ORM**: Drizzle ORM
3. **Database Client**: Neon PostgreSQL serverless (@neondatabase/serverless)
4. **Validation**: Zod for schema validation
5. **Sessions**: connect-pg-simple for session management

## 6. Deployment Strategy

The application is configured for deployment on Replit, with specific configurations in the `.replit` file:

1. **Development Mode**:
   - `npm run dev` starts the application in development mode
   - Vite provides hot module replacement
   - Server runs with tsx for TypeScript execution

2. **Production Build**:
   - Frontend is built using Vite
   - Server is bundled with esbuild
   - The application is served from a single Node.js process

3. **Database Management**:
   - Drizzle migrations are used for schema changes
   - Connection to Neon PostgreSQL is established at runtime

4. **Environment Configuration**:
   - Environment variables for database connections
   - NODE_ENV to distinguish between development and production

The deployment process is automated through Replit's deployment system, with build and run commands specified in the configuration.

## 7. Security Considerations

1. **Authentication**: The system includes a user model, suggesting user authentication is implemented or planned.

2. **API Security**:
   - Input validation with Zod schemas
   - Request logging for monitoring
   - Error handling to prevent information leakage

3. **Database Security**:
   - Connection to database via environment variables
   - Type safety through Drizzle ORM
   - Prepared statements to prevent SQL injection

4. **Frontend Security**:
   - API requests include CSRF protection via credentials inclusion
   - Error handling to prevent exposing sensitive information