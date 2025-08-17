import { pgTable, serial, text, timestamp, integer, real, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// User Management
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  name: text('name').notNull(), // Keep for backward compatibility
  email: text('email').unique().notNull(),
  username: text('username').unique(),
  phone: text('phone'),
  address: text('address'),
  profilePhoto: text('profile_photo'),
  idDocument: text('id_document'),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'agent', 'engineer'] }).default('agent').notNull(),
  isActive: boolean('is_active').default(true),
  storageUsed: integer('storage_used').default(0), // Storage used in bytes
  storageLimit: integer('storage_limit').default(524288000), // 500MB limit in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Product Catalog
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: text('price').notNull(),
  pitch: text('pitch'),
  talkingPoints: text('talking_points'),
  agentNotes: text('agent_notes'),
  priority: text('priority', { enum: ['High', 'Medium', 'Low'] }).default('Medium'),
  profitLevel: text('profit_level', { enum: ['High Profit', 'Standard', 'Low Margin'] }).default('Standard'),
  tags: text('tags').array(),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Lead Management
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  status: text('status', {
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  }).default('new').notNull(),
  source: text('source'),
  value: real('value'),
  assignedTo: integer('assigned_to').references(() => users.id),
  assignedEngineer: integer('assigned_engineer').references(() => users.id),
  notes: text('notes'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  score: integer('score').default(0),
  engineeringProgress: integer('engineering_progress').default(0),
  engineeringNotes: text('engineering_notes'),
  tags: text('tags').array(),
  followUpDate: timestamp('follow_up_date'),
  lastContactedAt: timestamp('last_contacted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Lead-Product Junction Table (Many-to-Many)
export const leadProducts = pgTable('lead_products', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Interaction Logging
export const interactions = pgTable('interactions', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: text('type', { enum: ['note', 'email', 'call', 'meeting', 'urgent', 'team'] }).default('note').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// External Integrations (Webhooks)
export const webhooks = pgTable('webhooks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  events: text('events').array(),
  headers: jsonb('headers').default({}),
  secret: text('secret'),
  isActive: boolean('is_active').default(true),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// External Links for Leads (replaces file attachments)
export const leadLinks = pgTable('lead_links', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description'), // Optional description/comment for the link
  platform: text('platform', { 
    enum: ['dropbox', 'googledrive', 'youtube', 'instagram', 'tiktok', 'facebook', 'linkedin', 'twitter', 'website', 'other'] 
  }).notNull(),
  addedById: integer('added_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// MCP (Model Context Protocol) Server Management
export const mcpServers = pgTable('mcp_servers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true),
  config: jsonb('config').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedLeads: many(leads, { relationName: 'assignedAgent' }),
  engineeringLeads: many(leads, { relationName: 'assignedEngineer' }),
  interactions: many(interactions),
  links: many(leadLinks),
}));

export const productsRelations = relations(products, ({ many }) => ({
  leadProducts: many(leadProducts),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedAgent: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
    relationName: 'assignedAgent',
  }),
  assignedEngineerUser: one(users, {
    fields: [leads.assignedEngineer],
    references: [users.id],
    relationName: 'assignedEngineer',
  }),
  leadProducts: many(leadProducts),
  interactions: many(interactions),
  links: many(leadLinks),
}));

export const leadProductsRelations = relations(leadProducts, ({ one }) => ({
  lead: one(leads, {
    fields: [leadProducts.leadId],
    references: [leads.id],
  }),
  product: one(products, {
    fields: [leadProducts.productId],
    references: [products.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  lead: one(leads, {
    fields: [interactions.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
}));

export const leadLinksRelations = relations(leadLinks, ({ one }) => ({
  lead: one(leads, {
    fields: [leadLinks.leadId],
    references: [leads.id],
  }),
  addedBy: one(users, {
    fields: [leadLinks.addedById],
    references: [users.id],
  }),
}));

// Insert and Select Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  lastTriggered: true,
});

export const insertLeadLinkSchema = createInsertSchema(leadLinks).omit({
  id: true,
  createdAt: true,
});

export const insertLeadProductSchema = createInsertSchema(leadProducts).omit({
  id: true,
  createdAt: true,
});

export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type LeadLink = typeof leadLinks.$inferSelect;
export type InsertLeadLink = z.infer<typeof insertLeadLinkSchema>;
export type LeadProduct = typeof leadProducts.$inferSelect;
export type InsertLeadProduct = z.infer<typeof insertLeadProductSchema>;
export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;
