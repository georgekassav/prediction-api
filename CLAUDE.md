# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Predictions API

## Overview

This is a multi-sport prediction platform where users can make predictions about sports leagues and individual games. It supports (almost) real-time updates from external providers like API-Sports, and also manual entry for niche or unsupported leagues.

Users are able to place their predictions in different competitions of major sports and win special prizes.

This repository is a Node.js app that uses Express in order to act as the API for the Predictions app.

## Architecture

The whole app is hosted in Railway and uses Github Actions.
There are 3 repositories:

- API (this): Handles the API and the database
- Frontend: Web application
- Mobile app: Mobile application

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Cache/Sessions**: Redis (refresh tokens)
- **Authentication**: Passport.js with JWT strategy
- **Validation**: Joi
- **Testing**: Jest with Supertest
- **Code Quality**: ESLint + Prettier

## Project Structure

```
prediction-api/
├── src/
│   ├── common/                 # Shared code
│   │   ├── base/               # Base classes
│   │   │   ├── base.service.ts    # BaseService with Drizzle CRUD
│   │   │   └── base.controller.ts # BaseController with standard handlers
│   │   ├── config/             # Configuration
│   │   │   ├── config.ts          # Centralized environment config
│   │   │   ├── database.ts        # Re-exports from db/
│   │   │   ├── jwt.ts             # JWT settings
│   │   │   ├── redis.ts           # Redis client
│   │   │   └── passport.ts        # Passport JWT strategy
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.ts            # Passport authentication
│   │   │   ├── errorHandler.ts    # Global error handling
│   │   │   └── validate.ts        # Joi validation
│   │   ├── types/              # TypeScript types
│   │   │   ├── index.ts           # App types
│   │   │   └── express.d.ts       # Express User extension
│   │   └── utils/              # Utility functions
│   ├── db/                     # Database (Drizzle)
│   │   ├── index.ts               # Drizzle client
│   │   ├── schema.ts              # Table definitions
│   │   └── migrate.ts             # Migration runner
│   ├── modules/                # Feature modules
│   │   ├── auth/               # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schemas.ts
│   │   │   └── auth.test.ts
│   │   └── users/              # Users module
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       ├── users.routes.ts
│   │       ├── users.schemas.ts
│   │       └── users.test.ts
│   ├── routes/                 # Route aggregator
│   ├── app.ts                  # Express app setup
│   └── index.ts                # Entry point
├── migrations/                 # Drizzle migrations
├── drizzle.config.ts           # Drizzle config
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
└── .prettierrc
```

## Module Structure

Each module follows this pattern:
- `*.controller.ts` - Route handlers (extends BaseController for CRUD)
- `*.service.ts` - Business logic (extends BaseService for CRUD)
- `*.routes.ts` - Express route definitions
- `*.schemas.ts` - Joi validation schemas
- `*.test.ts` - Jest tests

## BaseService Methods

All services extending BaseService have these methods:
- `getAll(options)` - Get all with pagination
- `getById(id)` - Get by ID (returns null if not found)
- `getByIdOrFail(id)` - Get by ID (throws 404 if not found)
- `create(data)` - Create new entity
- `updateById(id, data)` - Update by ID
- `deleteById(id)` - Delete by ID
- `exists(id)` - Check if exists
- `count()` - Get total count
- `findOne(where, params)` - Find single by condition
- `findMany(where, params, options)` - Find many by condition

## Commands

```bash
npm run dev          # Development with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build
npm test             # Run tests
npm run lint         # Run ESLint
npm run format       # Format with Prettier

# Database (Drizzle)
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio (database GUI)

# Docker (local development)
docker compose up -d    # Start PostgreSQL and Redis
docker compose down     # Stop containers
```

## Environment Configuration

All environment variables are centralized in `src/common/config/config.ts`. **Never use `process.env` directly** - always import from the config:

```typescript
import { config } from '../common/config';

// Use config.VARIABLE_NAME (always CAPITALIZED)
console.log(config.PORT);
console.log(config.DATABASE_URL);
console.log(config.IS_PRODUCTION);
```

### Available Config Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | `development` |
| `PORT` | Server port | `3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3001` |
| `DATABASE_URL` | PostgreSQL connection string | required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWTs | required in production |
| `IS_PRODUCTION` | Helper: true if NODE_ENV === 'production' | - |
| `IS_TEST` | Helper: true if NODE_ENV === 'test' | - |
| `IS_DEVELOPMENT` | Helper: true if NODE_ENV === 'development' | - |

### Adding New Environment Variables

1. Add the variable to `src/common/config/config.ts`
2. Add it to `.env.example` with a description
3. Use CAPITALIZED names matching the env var name

## Database (Drizzle ORM)

### Schema Definition

Tables are defined in `src/db/schema.ts` using Drizzle's type-safe schema builder:

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // ...
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Migration Workflow

1. Modify schema in `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `migrations/`
4. Apply migration: `npm run db:migrate`

### Using in Services

Services extend BaseService with the Drizzle table:

```typescript
class UsersService extends BaseService<typeof users> {
  constructor() {
    super(users);
  }
}
```

For custom queries, use the `db` client directly:

```typescript
import { db, users } from '../../db';
import { eq } from 'drizzle-orm';

const user = await db.select().from(users).where(eq(users.email, email));
```

## Authentication (Passport.js)

JWT-based authentication using Passport.js with two token types:

- **Access Token**: Short-lived (15 min), sent in Authorization header
- **Refresh Token**: Long-lived (7 days), stored in Redis, sent as httpOnly cookie, rotated on use

### Protected Routes

Use the `authenticate` middleware:

```typescript
router.get('/me', authenticate, controller.me);
```

The middleware attaches `req.user` with `{ id, email, username }`.

### Auth Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login, returns accessToken in body, sets refreshToken cookie
- `POST /api/auth/refresh` - Refresh tokens (reads cookie, rotates token)
- `POST /api/auth/logout` - Logout (requires JWT, clears cookie)
- `GET /api/auth/me` - Get current user (requires JWT)

## Adding a New Module

1. Create folder: `src/modules/{name}/`
2. Create files:
   - `{name}.schemas.ts` - Joi schemas
   - `{name}.service.ts` - Extend BaseService
   - `{name}.controller.ts` - Extend BaseController
   - `{name}.routes.ts` - Define routes
   - `{name}.test.ts` - Tests
   - `index.ts` - Exports
3. Add route to `src/routes/index.ts`
4. Create migration if needed in `migrations/`

## 🪄 Features

### League predictions

#### Overview

Players will be able to rank the teams in descending order based on the position they believe they will get on the league.

#### Scoring

Scoring comes based on the user’s leaderboard position relative to the round, which may give a multiplier.

⚽ The win gives 2 times the points of the position of the team and the draw gives each team’s point of the position.

🏀 The win gives the points of the position of the team.

#### Available Leagues

- ⚽ Premier League
- ⚽ La Liga
- ⚽ Serie A
- ⚽ Bundesliga
- ⚽ Ligue 1
- ⚽ Stoiximan Super League
- ⚽ UEFA Champions League
- ⚽ UEFA Europa League
- ⚽ UEFA Conference League
- ⚽ FIFA World Cup
- 🏀 Euroleague
- 🏀 NBA
- 🏀 FIBA Eurobasket

### Game predictions

#### Overview

Players will be able to fill their brackets in knockout tournaments.

#### Scoring

TBD, probably per type

Let the users select if they want to pick

Example types: Full time result, Correct score

#### Available leagues

Same as league

### Bracket challenge

#### Overview

Players will be able to fill their brackets in knockout tournaments.

#### Scoring

Still to be determined

#### Available leagues

- ⚽ UEFA Champions League
- ⚽ UEFA Europa League
- ⚽ UEFA Conference League
- ⚽ FIFA World Cup
- 🏀 NBA (playoffs)
- 🏀 Euroleague (playoffs)
