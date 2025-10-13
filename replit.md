# Siwaht AI Service CRM

## Overview

Siwaht CRM is a full-stack Customer Relationship Management system designed specifically for managing AI service sales. The platform handles the complete sales pipeline for AI services including website generation, video ads, chat agents, and voice AI solutions. The system supports role-based access control with three distinct user types: Admin, Agent, and Engineer, each with tailored functionality and permissions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built with React 18 and TypeScript, utilizing modern development patterns:
- **Build System**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design system
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **UI Interactions**: React Beautiful DnD for drag-and-drop Kanban functionality
- **Component Architecture**: Modular component structure with separate pages, components, and UI primitives

### Backend Architecture
The server follows a RESTful API design using Node.js and Express:
- **Runtime**: Node.js with ES modules and TypeScript
- **Framework**: Express.js with session-based authentication
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Cookie-based sessions with bcryptjs password hashing
- **File Handling**: Multer middleware for file uploads and attachments
- **WebSocket Integration**: Custom MCP (Model Context Protocol) server for AI agent communication
- **API Design**: RESTful endpoints organized by resource with proper HTTP status codes

### Data Architecture
The database schema supports comprehensive CRM functionality:
- **User Management**: Role-based access with admin, agent, and engineer permissions
- **Lead Pipeline**: Complete sales funnel tracking from new leads to closed deals
- **Product Catalog**: AI service offerings with pricing, priorities, and agent notes
- **Interaction Logging**: Detailed communication history with leads
- **File Management**: Lead attachments and document storage
- **Webhook System**: External integrations with secure signature validation
- **Analytics**: Dashboard metrics and conversion tracking

### Authentication & Security
Security is implemented through multiple layers:
- **Session Management**: Secure cookie-based sessions with proper configuration
- **Password Security**: bcryptjs hashing with salt rounds
- **Role-Based Access**: Middleware protection for sensitive endpoints
- **Input Validation**: Zod schema validation on both client and server
- **File Upload Security**: Size limits and type restrictions for attachments
- **Admin Account Protection**: Multi-layer protection against accidental deletion
  - Admin users cannot be deleted individually via API
  - Admin accounts are preserved during database resets
  - Admin accounts are preserved during database imports
  - Protection status monitoring with admin count tracking

### Role-Based Access Control
The system implements comprehensive role-based access control for lead management:
- **Agents**: Can only view, edit, and interact with leads they created (assignedTo = their user ID)
- **Engineers and Admins**: Have full access to all leads in the system
- **Permission Enforcement**: Applied across all endpoints including lead viewing, editing, interactions, attachments, and CSV exports
- **Lead Creation**: When agents create leads, they are automatically assigned as the lead owner to maintain visibility

### External Integrations
The system is designed for extensibility with external services:
- **Enhanced Webhook System**: Configurable webhooks for lead and interaction events with HMAC signature verification
  - Lead creation webhooks include comprehensive lead details: name, email, phone, dealValue, status, priority, interestedProductNames, followUpDate, notes, and creator information (agent name, email, role)
  - Interaction webhooks include complete lead information (name, email, company, status, value) and agent information (name, email, role)
  - Supports events: lead.created, lead.updated, lead.deleted, lead.assigned, interaction.created, interaction.updated, interaction.deleted
- **Admin Lead Assignment**: Admin-controlled lead assignment capabilities
  - Individual agent assignment via PUT /api/leads/:id/assign-agent
  - Individual engineer assignment via PUT /api/leads/:id/assign-engineer
  - Bulk assignment support for multiple leads simultaneously
  - Assignment options endpoint providing available agents and engineers
  - Webhook notifications for all assignment events
- **MCP Protocol**: WebSocket-based AI agent integration for automated lead processing
- **Platform-Agnostic Object Storage**: Universal storage abstraction supporting multiple cloud providers
  - AWS S3, Azure Blob Storage, Google Cloud Storage, and local filesystem
  - Provider selection via environment variable (STORAGE_PROVIDER)
  - Consistent API across all providers with automatic adapter selection
  - Support for signed URLs, ACL policies, and metadata management
- **Database**: PostgreSQL via Neon serverless with connection pooling

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL (via @neondatabase/serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Express sessions with bcryptjs password hashing
- **File Storage**: Local filesystem with multer for file uploads

### Frontend Dependencies
- **UI Framework**: React 18 with TypeScript
- **Component Library**: Radix UI primitives with shadcn/ui styling
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS with custom design tokens
- **Form Validation**: React Hook Form with Zod schemas

### Development Tools
- **Build Tool**: Vite with TypeScript support
- **Code Quality**: TypeScript strict mode configuration
- **Development Server**: Vite dev server with HMR
- **Package Management**: npm with lock file for consistent installs

### Third-Party Services
- **Cloud Storage**: Platform-agnostic storage abstraction supporting:
  - AWS S3 (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
  - Azure Blob Storage (@azure/storage-blob)
  - Google Cloud Storage (@google-cloud/storage)
  - Local filesystem for development
- **Real-time Communication**: WebSocket server for AI agent integration
- **Data Processing**: Support for Excel (xlsx) and CSV (papaparse) imports
- **Analytics**: Chart.js and Recharts for data visualization

The architecture prioritizes type safety, scalability, and maintainability while providing a comprehensive CRM solution tailored for AI service sales teams.

## Platform-Agnostic Deployment

The CRM system is designed to run on any cloud platform (AWS, Azure, Google Cloud, or on-premises) through a universal storage abstraction layer.

### Storage Provider Configuration

Set the `STORAGE_PROVIDER` environment variable to select your storage backend:

#### Local Filesystem (Development)
```bash
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./storage
BASE_URL=http://localhost:5000
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/private
```

#### AWS S3
```bash
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/private
```

#### Azure Blob Storage
```bash
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
# OR
AZURE_STORAGE_ACCOUNT_NAME=your_account
AZURE_STORAGE_ACCOUNT_KEY=your_key
PUBLIC_OBJECT_SEARCH_PATHS=/container-name/public
PRIVATE_OBJECT_DIR=/container-name/private
```

#### Google Cloud Storage
```bash
STORAGE_PROVIDER=gcs
# Option 1: Replit environment (automatic)
USE_REPLIT_OBJECT_STORAGE=true

# Option 2: Custom GCP credentials
GCP_PROJECT_ID=your_project_id
GCP_KEY_FILENAME=/path/to/service-account.json
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/private
```

### Storage Provider Features

All storage providers support:
- **File Upload/Download**: Streaming file operations with progress tracking
- **Signed URLs**: Temporary, secure URLs for direct client uploads
- **ACL Policies**: Fine-grained access control with public/private visibility
- **Metadata Management**: Custom metadata storage for files
- **Path Normalization**: Consistent path handling across providers

### Switching Providers

To deploy the same codebase to a different platform:

1. Update the `STORAGE_PROVIDER` environment variable
2. Configure the provider-specific credentials
3. Update bucket/container names in `PUBLIC_OBJECT_SEARCH_PATHS` and `PRIVATE_OBJECT_DIR`
4. Restart the application

No code changes are required - the storage adapter is selected automatically based on configuration.