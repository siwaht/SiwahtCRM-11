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

### External Integrations
The system is designed for extensibility with external services:
- **Webhook System**: Configurable webhooks for lead events with HMAC signature verification
- **MCP Protocol**: WebSocket-based AI agent integration for automated lead processing
- **File Storage**: Local file system with plans for cloud storage integration
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
- **Cloud Storage**: Google Cloud Storage (@google-cloud/storage) for file management
- **Real-time Communication**: WebSocket server for AI agent integration
- **Data Processing**: Support for Excel (xlsx) and CSV (papaparse) imports
- **Analytics**: Chart.js and Recharts for data visualization

The architecture prioritizes type safety, scalability, and maintainability while providing a comprehensive CRM solution tailored for AI service sales teams.