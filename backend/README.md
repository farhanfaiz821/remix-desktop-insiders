# ZYNX AI Backend

Node.js + Express + TypeScript backend API for ZYNX AI Assistant.

## Features

- **Authentication**: JWT-based auth with refresh tokens
- **Trial System**: Automatic 24-hour trial for new users
- **Subscriptions**: Stripe integration for payments
- **AI Chat**: OpenAI API integration
- **Security**: bcrypt, rate limiting, CORS, Helmet
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and rate limiting

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp ../.env.example .env

# Edit .env with your configuration
```

## Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed

# Open Prisma Studio (optional)
npm run prisma:studio
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Server will run on http://localhost:3000
```

## Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

### Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/:id` - Delete message
- `GET /api/chat/export` - Export chat
- `DELETE /api/chat` - Clear history

### Stripe
- `POST /api/stripe/checkout-session` - Create checkout
- `POST /api/stripe/webhook` - Webhook handler
- `GET /api/stripe/subscription` - Get subscription
- `POST /api/stripe/cancel` - Cancel subscription
- `GET /api/stripe/plans` - Get available plans

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user
- `GET /api/admin/subscriptions` - List subscriptions
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/logs` - Get audit logs

## Environment Variables

See `.env.example` in the root directory for all required variables.

## Docker

```bash
# Build image
docker build -t zynx-backend .

# Run container
docker run -p 3000:3000 --env-file .env zynx-backend
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Prisma client
│   │   ├── redis.ts     # Redis client
│   │   └── env.ts       # Environment validation
│   ├── controllers/     # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── stripe.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication
│   │   ├── trial.ts     # Trial validation
│   │   ├── rateLimit.ts # Rate limiting
│   │   ├── validation.ts # Input validation
│   │   └── errorHandler.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── stripe.routes.ts
│   │   ├── admin.routes.ts
│   │   └── index.ts
│   ├── services/        # Business logic
│   │   ├── openai.service.ts
│   │   ├── stripe.service.ts
│   │   └── twilio.service.ts
│   ├── utils/           # Helper functions
│   │   ├── jwt.ts       # JWT utilities
│   │   ├── hash.ts      # Hashing utilities
│   │   └── validation.ts # Zod schemas
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── server.ts        # Express app entry
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed script
├── tests/               # Test files
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 1h expiry
- Refresh token rotation
- Rate limiting on all endpoints
- CORS whitelist
- Helmet security headers
- Input validation with Zod
- Device fingerprinting
- Stripe webhook signature verification

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check connection string in .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/zynxai
```

### Redis Connection Error
```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker exec -it zynx-redis redis-cli ping
```

### Prisma Migration Error
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## License

MIT
