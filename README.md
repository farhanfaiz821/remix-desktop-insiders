# ZYNX AI Assistant

A secure, production-ready AI assistant application with mobile (Android/iOS) and web admin interfaces, featuring a 24-hour free trial and Stripe subscription system.

## 🚀 Features

- **24-Hour Free Trial**: Every new user gets automatic 24-hour trial access
- **Stripe Subscriptions**: Seamless payment integration with test mode
- **AI Chat**: Powered by OpenAI API with persistent message history
- **Multi-Platform**: React Native mobile app + React web admin panel
- **Security First**: JWT auth, bcrypt hashing, rate limiting, device fingerprinting
- **Anti-Abuse**: Phone OTP verification, device fingerprinting, rate limiting
- **Admin Dashboard**: User management, subscription monitoring, analytics
- **Export Chat**: Users can export their conversation history

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native (Expo), TypeScript |
| **Web Admin** | React, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **Cache** | Redis |
| **AI** | OpenAI API |
| **Payments** | Stripe (test mode) |
| **Auth** | JWT + Refresh Tokens |
| **Infrastructure** | Docker, Docker Compose, Terraform |

## 🏗️ Project Structure

```
zynx-ai-assistant/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth, validation, rate limiting
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic (OpenAI, Stripe, Twilio)
│   │   ├── utils/        # Helper functions
│   │   └── server.ts     # Express app entry
│   ├── prisma/           # Database schema & migrations
│   ├── tests/            # Unit & integration tests
│   └── Dockerfile
├── mobile/               # React Native (Expo) app
│   ├── src/
│   │   ├── screens/      # App screens
│   │   ├── components/   # Reusable components
│   │   ├── navigation/   # Navigation setup
│   │   ├── services/     # API client
│   │   └── hooks/        # Custom hooks
│   └── app.json
├── web-admin/            # React admin panel
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Admin pages
│   │   ├── services/     # API client
│   │   └── hooks/        # Custom hooks
│   └── vite.config.ts
├── terraform/            # Infrastructure as Code
├── scripts/              # Utility scripts
├── docker-compose.yml    # Local development setup
└── README.md
```

## 🛠️ Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)
- **Expo CLI** (for mobile development)
- **Stripe CLI** (optional, for webhook testing)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd zynx-ai-assistant

# Install dependencies for all workspaces
npm run install:all
```

### 2. Environment Setup

```bash
# Copy environment variables
cp .env.example backend/.env

# Edit backend/.env with your actual keys (or use test keys provided)
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Wait for services to be healthy (check with docker-compose ps)
```

### 4. Database Setup

```bash
# Run Prisma migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 5. Start Backend

```bash
# Start backend server
npm run dev:backend

# Backend will run on http://localhost:3000
```

### 6. Start Mobile App

```bash
# In a new terminal
npm run dev:mobile

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

### 7. Start Web Admin

```bash
# In a new terminal
npm run dev:admin

# Admin panel will run on http://localhost:5173
```

## 🐳 Docker Development

Run everything with Docker:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

## 📱 Building Mobile App

### Android APK

```bash
cd mobile

# Build APK
eas build --platform android --profile preview

# Or build locally
npx expo prebuild
cd android
./gradlew assembleRelease
```

### iOS IPA

```bash
cd mobile

# Build IPA (requires Apple Developer account)
eas build --platform ios --profile preview
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Trial Flow

```bash
# Automated test script
./scripts/test-trial-flow.sh
```

### Manual Testing Checklist

- [ ] **Signup**: Create account → trial starts (24h)
- [ ] **Login**: JWT tokens issued correctly
- [ ] **Chat**: Send message → receive AI response
- [ ] **Trial Expiry**: Simulate expiry → chat blocked (402 error)
- [ ] **Stripe Checkout**: Create checkout session → redirect to Stripe
- [ ] **Webhook**: Complete payment → subscription activated
- [ ] **Chat Unlocked**: Send message after subscription → works
- [ ] **Device Fingerprint**: Multiple signups from same device blocked
- [ ] **Rate Limiting**: Excessive requests blocked
- [ ] **Admin Panel**: View users, subscriptions, analytics
- [ ] **Export Chat**: Download conversation history
- [ ] **Refresh Token**: Token rotation works correctly

## 🔐 Security Features

### Authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Access token (1h) + Refresh token (7d)
- **HTTP-Only Cookies**: Secure refresh token storage
- **Token Rotation**: Refresh tokens rotated on use

### Protection
- **Rate Limiting**: 100 requests/15min per IP, 20 chat/hour per user
- **CORS**: Whitelist specific origins
- **Helmet**: Security headers enabled
- **Input Validation**: Zod schemas for all endpoints
- **Device Fingerprinting**: Prevent trial abuse
- **OTP Verification**: Phone verification for signup

### Stripe Security
- **Webhook Signature**: Verify all Stripe events
- **Test Mode**: All keys in test mode
- **No Frontend Keys**: API keys never exposed to client

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/signup          # Create account + start trial
POST   /api/auth/login           # Login with email/password
POST   /api/auth/refresh         # Refresh access token
POST   /api/auth/logout          # Logout and invalidate tokens
POST   /api/auth/verify-otp      # Verify phone OTP
```

### Chat
```
POST   /api/chat                 # Send message to AI
GET    /api/chat/history         # Get chat history
POST   /api/chat/export          # Export chat as JSON/CSV
DELETE /api/chat/:id             # Delete message
```

### Subscription
```
POST   /api/stripe/checkout-session    # Create Stripe checkout
POST   /api/stripe/webhook              # Stripe webhook handler
GET    /api/stripe/subscription         # Get user subscription
POST   /api/stripe/cancel               # Cancel subscription
```

### Admin (Protected)
```
GET    /api/admin/users          # List all users
GET    /api/admin/users/:id      # Get user details
POST   /api/admin/users/:id/ban  # Ban user
GET    /api/admin/subscriptions  # List subscriptions
GET    /api/admin/analytics      # Get analytics data
```

## 💳 Subscription Plans (Test Mode)

| Plan | Price | Features |
|------|-------|----------|
| **Basic** | $9.99/mo | 100 messages/day, Standard support |
| **Pro** | $19.99/mo | 500 messages/day, Priority support |
| **Enterprise** | $49.99/mo | Unlimited messages, Dedicated support |

## 🌍 Deployment

### AWS Deployment (Terraform)

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan

# Apply infrastructure
terraform apply

# Outputs will include:
# - ECS cluster URL
# - RDS endpoint
# - Redis endpoint
# - Load balancer DNS
```

### Manual Deployment Steps

1. **Build Docker Images**
```bash
cd backend
docker build -t zynx-backend:latest .
docker tag zynx-backend:latest <ecr-repo-url>:latest
docker push <ecr-repo-url>:latest
```

2. **Deploy to ECS**
- Update task definition with new image
- Update ECS service

3. **Configure Environment**
- Set environment variables in AWS Secrets Manager
- Update ECS task definition to use secrets

4. **Set Up Stripe Webhook**
- Configure webhook URL: `https://your-domain.com/api/stripe/webhook`
- Add webhook secret to environment variables

5. **Deploy Web Admin**
```bash
cd web-admin
npm run build
# Deploy to Vercel/Netlify/S3+CloudFront
```

6. **Build Mobile App**
- Update API URL in mobile app config
- Build and submit to App Store / Play Store

## 🔧 Configuration

### Environment Variables

See `.env.example` for all required environment variables.

**Critical Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for signing JWT tokens
- `OPENAI_API_KEY`: OpenAI API key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret

### Stripe Setup

1. Create Stripe account (test mode)
2. Create products and prices
3. Copy price IDs to environment variables
4. Set up webhook endpoint
5. Copy webhook secret

### OpenAI Setup

1. Create OpenAI account
2. Generate API key
3. Add to environment variables
4. Set usage limits (optional)

## 📈 Monitoring & Logs

### Application Logs
```bash
# Docker logs
docker-compose logs -f backend

# Application logs (in production)
# Check CloudWatch Logs or your logging service
```

### Database Monitoring
```bash
# Prisma Studio (development)
npm run prisma:studio

# PostgreSQL queries
docker exec -it zynx-postgres psql -U postgres -d zynxai
```

### Redis Monitoring
```bash
# Redis CLI
docker exec -it zynx-redis redis-cli

# Monitor commands
MONITOR
INFO
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run prisma:migrate
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker exec -it zynx-redis redis-cli ping
```

### Mobile App Issues
```bash
# Clear Expo cache
cd mobile
npx expo start -c

# Reset Metro bundler
npx react-native start --reset-cache
```

### Stripe Webhook Testing
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Stripe API Reference](https://stripe.com/docs/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Native Documentation](https://reactnative.dev)

## 🔒 Security Checklist (OWASP Top 10)

- [x] **A01: Broken Access Control** - JWT auth, role-based access
- [x] **A02: Cryptographic Failures** - bcrypt hashing, HTTPS only
- [x] **A03: Injection** - Parameterized queries (Prisma), input validation
- [x] **A04: Insecure Design** - Trial system, rate limiting, device fingerprinting
- [x] **A05: Security Misconfiguration** - Helmet, CORS, secure headers
- [x] **A06: Vulnerable Components** - Regular dependency updates
- [x] **A07: Authentication Failures** - Strong password policy, OTP, token rotation
- [x] **A08: Software/Data Integrity** - Webhook signature verification
- [x] **A09: Logging Failures** - Comprehensive logging, monitoring
- [x] **A10: SSRF** - Input validation, URL whitelisting

## 📄 License

MIT License - see LICENSE file for details

## 👥 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@zynxai.com
- Documentation: https://docs.zynxai.com

---

**Built with ❤️ by the ZYNX Team**
