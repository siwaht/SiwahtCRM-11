# Siwaht AI Service CRM - Complete Replication Guide

## System Prompt

```
Build a comprehensive Customer Relationship Management (CRM) system specifically designed for managing AI service sales. The platform should handle the complete sales pipeline for AI services including website generation, video ads, chat agents, and voice AI solutions.

### Core Requirements:

1. **Role-Based Access Control (RBAC)**
   - Three user types: Admin, Agent, and Engineer
   - Admins: Full system access, user management, analytics oversight
   - Agents: Lead management (only their assigned leads), interaction logging, sales tracking
   - Engineers: Technical implementation tracking, engineering progress updates, full lead access

2. **Lead Management System**
   - Complete sales funnel: new → contacted → qualified → proposal → negotiation → won/lost
   - Lead scoring and prioritization (low/medium/high)
   - Automated follow-up reminders
   - Lead assignment to agents and engineers
   - Bulk operations (import/export CSV, bulk assignment)
   - Lead tagging and categorization

3. **Product Catalog**
   - AI service offerings with pricing
   - Product priorities and profit levels
   - Agent talking points and pitch scripts
   - Product-lead association (many-to-many)

4. **Interaction Tracking**
   - Log all communications (notes, emails, calls, meetings)
   - Team collaboration notes
   - Urgent flags for critical interactions
   - Complete interaction history per lead

5. **File Management**
   - Lead attachments and documents
   - User profile photos and ID documents
   - Storage quota management per user (500MB default)
   - Secure file upload/download

6. **Analytics Dashboard**
   - Role-specific metrics
   - Conversion funnel visualization
   - Revenue tracking and forecasting
   - Agent performance metrics
   - Product performance analysis

7. **External Integrations**
   - Webhook system with HMAC signature validation
   - Events: lead.created, lead.updated, lead.deleted, lead.assigned, interaction.created
   - MCP (Model Context Protocol) WebSocket server for AI agent integration
   - Database: PostgreSQL with Drizzle ORM

8. **Security Features**
   - Cookie-based session authentication
   - Password hashing with bcryptjs
   - Admin account protection (prevent accidental deletion)
   - Input validation with Zod schemas
   - File upload restrictions

### Technical Stack:

**Frontend:**
- React 18 with TypeScript
- Vite build system
- Tailwind CSS + shadcn/ui components
- TanStack Query for state management
- Wouter for routing
- React Hook Form + Zod validation
- React Beautiful DnD for Kanban boards
- Chart.js and Recharts for analytics

**Backend:**
- Node.js with Express
- PostgreSQL database
- Drizzle ORM for type-safe database operations
- Session-based authentication
- Multer for file uploads
- WebSocket server for real-time features

### UI/UX Requirements:
- Dark theme with slate-900 background
- Responsive design for all screen sizes
- Drag-and-drop Kanban board for lead management
- Real-time updates and optimistic UI updates
- Comprehensive search and filtering
- Export capabilities (CSV, Excel)
```

## Database Schema

```sql
-- Core tables structure (see shared/schema.ts for complete implementation)

-- Users table with role-based access
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  profile_photo TEXT,
  id_document TEXT,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'agent', 'engineer')) DEFAULT 'agent',
  is_active BOOLEAN DEFAULT true,
  storage_used INTEGER DEFAULT 0,
  storage_limit INTEGER DEFAULT 524288000, -- 500MB
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products catalog
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  pitch TEXT,
  talking_points TEXT,
  agent_notes TEXT,
  priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
  profit_level TEXT CHECK (profit_level IN ('High Profit', 'Standard', 'Low Margin')) DEFAULT 'Standard',
  tags TEXT[],
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads management
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')) DEFAULT 'new',
  source TEXT,
  value REAL,
  assigned_to INTEGER REFERENCES users(id),
  assigned_engineer INTEGER REFERENCES users(id),
  notes TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  score INTEGER DEFAULT 0,
  engineering_progress INTEGER DEFAULT 0,
  engineering_notes TEXT,
  tags TEXT[],
  follow_up_date TIMESTAMP,
  last_contacted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lead-Product junction table
CREATE TABLE lead_products (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interactions tracking
CREATE TABLE interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  type TEXT CHECK (type IN ('note', 'email', 'call', 'meeting', 'urgent', 'team')) DEFAULT 'note',
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks for external integrations
CREATE TABLE webhooks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[],
  headers JSONB DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lead attachments
CREATE TABLE lead_attachments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  description TEXT,
  uploaded_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- MCP server configuration
CREATE TABLE mcp_servers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Project Structure

```
siwaht-crm/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # Admin-specific components
│   │   │   ├── analytics/      # Analytics and charts
│   │   │   ├── engineering/    # Engineering view components
│   │   │   ├── kanban/         # Drag-drop Kanban board
│   │   │   ├── leads/          # Lead management components
│   │   │   ├── products/       # Product catalog components
│   │   │   └── ui/             # Shadcn UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility functions
│   │   ├── pages/              # Page components
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Global styles
├── server/
│   ├── ai-agent-integration.ts # MCP WebSocket server
│   ├── auth-simple.ts          # Authentication logic
│   ├── db.ts                   # Database connection
│   ├── index.ts                # Server entry point
│   ├── routes.ts               # API routes
│   ├── storage.ts              # Storage interface
│   ├── webhooks.ts             # Webhook handling
│   └── vite.ts                 # Vite dev server setup
├── shared/
│   └── schema.ts               # Database schema & types
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind configuration
├── vite.config.ts              # Vite configuration
└── drizzle.config.ts           # Drizzle ORM config
```

## Installation & Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=5000
SESSION_SECRET=your-secure-session-secret
```

### Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd siwaht-crm

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Push database schema
npm run db:push

# 5. Start development server
npm run dev
```

## Key Features Implementation

### 1. Authentication System
- Session-based authentication with Express sessions
- bcryptjs for password hashing
- Protected routes with middleware
- Role-based access control

### 2. Lead Pipeline Management
- Drag-and-drop Kanban board using React Beautiful DnD
- Status transitions with validation
- Automated scoring and prioritization
- Bulk operations support

### 3. Real-time Updates
- WebSocket server for MCP protocol
- Optimistic updates with TanStack Query
- Webhook notifications for external systems

### 4. Analytics Dashboard
- Role-specific metrics and KPIs
- Interactive charts with Chart.js and Recharts
- Export functionality to CSV/Excel
- Performance tracking

### 5. File Management
- Secure file uploads with Multer
- Storage quota management
- File attachment to leads
- Profile photo and document management

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user

### Users
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Leads
- `GET /api/leads` - List leads (filtered by role)
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `PUT /api/leads/:id/assign-agent` - Assign to agent
- `PUT /api/leads/:id/assign-engineer` - Assign to engineer
- `POST /api/leads/bulk-assign` - Bulk assignment
- `POST /api/leads/import` - Import from CSV
- `GET /api/leads/export` - Export to CSV

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Interactions
- `GET /api/leads/:id/interactions` - Get lead interactions
- `POST /api/leads/:id/interactions` - Create interaction
- `PUT /api/interactions/:id` - Update interaction
- `DELETE /api/interactions/:id` - Delete interaction

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/funnel` - Conversion funnel
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/products` - Product performance

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/webhooks/:id/test` - Test webhook

## Security Considerations

1. **Authentication**
   - Secure session management
   - Password complexity requirements
   - Session timeout configuration

2. **Authorization**
   - Role-based access control
   - Lead ownership validation
   - Admin privilege protection

3. **Data Validation**
   - Zod schema validation
   - Input sanitization
   - SQL injection prevention

4. **File Security**
   - File type restrictions
   - Size limitations
   - Virus scanning (optional)

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Database Migration
```bash
npm run db:push
```

### Environment Configuration
- Set `NODE_ENV=production`
- Configure secure session secret
- Set up SSL/TLS certificates
- Configure database connection pooling

## License
MIT License - See LICENSE file for details

## Support
For issues or questions, please contact the development team.