# ZYNX AI Admin Panel

React + Vite + Tailwind CSS admin panel for ZYNX AI Assistant.

## Features

- **Dashboard**: Overview of key metrics and statistics
- **User Management**: View, search, ban/unban users
- **Subscription Management**: Monitor active subscriptions
- **Analytics**: Detailed analytics and KPIs
- **Responsive Design**: Works on desktop and mobile

## Prerequisites

- Node.js 18+
- Backend API running

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

## Development

```bash
# Start development server
npm run dev

# Admin panel will run on http://localhost:5173
```

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Default Credentials

After running the backend seed script:

```
Email: admin@zynxai.com
Password: admin123
```

## Project Structure

```
web-admin/
├── src/
│   ├── components/      # Reusable components
│   │   └── Layout.tsx   # Main layout with navigation
│   ├── context/         # React Context
│   │   └── AuthContext.tsx
│   ├── pages/           # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── SubscriptionsPage.tsx
│   │   └── AnalyticsPage.tsx
│   ├── services/        # API services
│   │   └── api.ts
│   ├── App.tsx          # App entry with routing
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Features Guide

### Dashboard
- Total users, subscriptions, messages
- Monthly recurring revenue (MRR)
- Daily active users (DAU)
- Conversion rates

### Users
- List all users with pagination
- Search users by email/phone
- View subscription status
- Ban/unban users
- View message count

### Subscriptions
- List all active subscriptions
- View plan details
- Monitor renewal dates
- Track subscription status

### Analytics
- User metrics (total, new, trial, DAU)
- Subscription breakdown by plan
- Message statistics
- Key performance indicators (KPIs)
- Customizable time periods (7, 30, 90 days)

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
VITE_API_URL=https://your-api-url.com/api
```

### Netlify

```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Security

- JWT token stored in localStorage
- Automatic token refresh
- Protected routes
- Admin-only access
- HTTPS required in production

## License

MIT
