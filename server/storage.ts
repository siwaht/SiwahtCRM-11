import { db } from './db';
import { 
  users, 
  products, 
  leads, 
  interactions, 
  webhooks, 
  leadAttachments, 
  mcpServers,
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type Lead, 
  type InsertLead,
  type Interaction, 
  type InsertInteraction,
  type Webhook, 
  type InsertWebhook,
  type LeadAttachment, 
  type InsertLeadAttachment,
  type McpServer, 
  type InsertMcpServer 
} from "@shared/schema";
import { eq, desc, and, or, like, sql, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserStorage(userId: number, storageUsed: number): Promise<void>;
  addLeadAttachment(attachment: { leadId: number; fileName: string; filePath: string; uploadedById: number; fileSize: number; description?: string | null }): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  reorderProducts(productIds: number[]): Promise<boolean>;

  // Leads
  getLead(id: number): Promise<Lead | undefined>;
  getAllLeads(filters?: LeadFilters): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLeadsByAssignee(userId: number): Promise<Lead[]>;

  // Interactions
  getInteraction(id: number): Promise<Interaction | undefined>;
  getInteractionsByLead(leadId: number): Promise<Interaction[]>;
  getAllInteractions(): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  updateInteraction(id: number, interaction: Partial<InsertInteraction>): Promise<Interaction | undefined>;
  deleteInteraction(id: number): Promise<boolean>;

  // Webhooks
  getWebhook(id: number): Promise<Webhook | undefined>;
  getAllWebhooks(): Promise<Webhook[]>;
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: number, webhook: Partial<InsertWebhook>): Promise<Webhook | undefined>;
  deleteWebhook(id: number): Promise<boolean>;
  getActiveWebhooks(): Promise<Webhook[]>;

  // Lead Attachments
  getLeadAttachment(id: number): Promise<LeadAttachment | undefined>;
  getAttachmentsByLead(leadId: number): Promise<LeadAttachment[]>;
  createLeadAttachment(attachment: InsertLeadAttachment): Promise<LeadAttachment>;
  deleteLeadAttachment(id: number): Promise<boolean>;

  // MCP Servers
  getMcpServer(id: number): Promise<McpServer | undefined>;
  getAllMcpServers(): Promise<McpServer[]>;
  createMcpServer(server: InsertMcpServer): Promise<McpServer>;
  updateMcpServer(id: number, server: Partial<InsertMcpServer>): Promise<McpServer | undefined>;
  deleteMcpServer(id: number): Promise<boolean>;

  // Analytics
  getAnalytics(): Promise<AnalyticsData>;

  // Database Management
  exportDatabase(): Promise<DatabaseExport>;
  importDatabase(data: DatabaseExport): Promise<boolean>;
  deleteDatabase(): Promise<boolean>;
}

export interface LeadFilters {
  status?: string;
  assignedTo?: number;
  source?: string;
  search?: string;
  priority?: string;
}

export interface AnalyticsData {
  totalLeads: number;
  conversionRate: number;
  pipelineValue: number;
  activeProjects: number;
  leadsByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

export interface DatabaseExport {
  version: string;
  exportedAt: string;
  data: {
    users: User[];
    products: Product[];
    leads: Lead[];
    interactions: Interaction[];
    webhooks: Webhook[];
    leadAttachments: LeadAttachment[];
    mcpServers: McpServer[];
  };
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateUserStorage(userId: number, storageUsed: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({ storageUsed, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Update user storage error:', error);
      throw error;
    }
  }

  async addLeadAttachment(attachment: { leadId: number; fileName: string; filePath: string; uploadedById: number; fileSize: number; description?: string | null }): Promise<void> {
    try {
      await db.insert(leadAttachments).values({
        leadId: attachment.leadId,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
        fileSize: attachment.fileSize,
        uploadedById: attachment.uploadedById,
        description: attachment.description
      });
    } catch (error) {
      console.error('Add lead attachment error:', error);
      throw error;
    }
  }

  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.displayOrder), asc(products.name));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  async reorderProducts(productIds: number[]): Promise<boolean> {
    try {
      for (let i = 0; i < productIds.length; i++) {
        await db.update(products).set({ displayOrder: i }).where(eq(products.id, productIds[i]));
      }
      return true;
    } catch {
      return false;
    }
  }

  // Leads
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getAllLeads(filters?: LeadFilters): Promise<Lead[]> {
    let query = db.select().from(leads);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status as any));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(leads.assignedTo, filters.assignedTo));
    }
    if (filters?.source) {
      conditions.push(eq(leads.source, filters.source));
    }
    if (filters?.priority) {
      conditions.push(eq(leads.priority, filters.priority as any));
    }
    if (filters?.search) {
      conditions.push(
        or(
          like(leads.name, `%${filters.search}%`),
          like(leads.email, `%${filters.search}%`),
          like(leads.company, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      return await db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
    }

    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }

  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db.update(leads).set(updateData).where(eq(leads.id, id)).returning();
    return lead || undefined;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.status, status as any)).orderBy(desc(leads.createdAt));
  }

  async getLeadsByAssignee(userId: number): Promise<Lead[]> {
    return await db.select().from(leads).where(
      or(eq(leads.assignedTo, userId), eq(leads.assignedEngineer, userId))
    ).orderBy(desc(leads.createdAt));
  }

  // Interactions
  async getInteraction(id: number): Promise<Interaction | undefined> {
    const [interaction] = await db.select().from(interactions).where(eq(interactions.id, id));
    return interaction || undefined;
  }

  async getInteractionsByLead(leadId: number): Promise<Interaction[]> {
    return await db.select().from(interactions).where(eq(interactions.leadId, leadId)).orderBy(desc(interactions.createdAt));
  }

  async getAllInteractions(): Promise<Interaction[]> {
    return await db.select().from(interactions).orderBy(desc(interactions.createdAt));
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db.insert(interactions).values(insertInteraction).returning();
    return interaction;
  }

  async updateInteraction(id: number, updateData: Partial<InsertInteraction>): Promise<Interaction | undefined> {
    const [interaction] = await db.update(interactions).set(updateData).where(eq(interactions.id, id)).returning();
    return interaction || undefined;
  }

  async deleteInteraction(id: number): Promise<boolean> {
    const result = await db.delete(interactions).where(eq(interactions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Webhooks
  async getWebhook(id: number): Promise<Webhook | undefined> {
    const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id));
    return webhook || undefined;
  }

  async getAllWebhooks(): Promise<Webhook[]> {
    return await db.select().from(webhooks).orderBy(desc(webhooks.createdAt));
  }

  async createWebhook(insertWebhook: InsertWebhook): Promise<Webhook> {
    const [webhook] = await db.insert(webhooks).values(insertWebhook).returning();
    return webhook;
  }

  async updateWebhook(id: number, updateData: Partial<InsertWebhook>): Promise<Webhook | undefined> {
    const [webhook] = await db.update(webhooks).set(updateData).where(eq(webhooks.id, id)).returning();
    return webhook || undefined;
  }

  async deleteWebhook(id: number): Promise<boolean> {
    const result = await db.delete(webhooks).where(eq(webhooks.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getActiveWebhooks(): Promise<Webhook[]> {
    return await db.select().from(webhooks).where(eq(webhooks.isActive, true));
  }

  // Lead Attachments
  async getLeadAttachment(id: number): Promise<LeadAttachment | undefined> {
    const [attachment] = await db.select().from(leadAttachments).where(eq(leadAttachments.id, id));
    return attachment || undefined;
  }

  async getAttachmentsByLead(leadId: number): Promise<LeadAttachment[]> {
    return await db.select().from(leadAttachments).where(eq(leadAttachments.leadId, leadId)).orderBy(desc(leadAttachments.createdAt));
  }

  async createLeadAttachment(insertAttachment: InsertLeadAttachment): Promise<LeadAttachment> {
    const [attachment] = await db.insert(leadAttachments).values(insertAttachment).returning();
    return attachment;
  }

  async deleteLeadAttachment(id: number): Promise<boolean> {
    const result = await db.delete(leadAttachments).where(eq(leadAttachments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // MCP Servers
  async getMcpServer(id: number): Promise<McpServer | undefined> {
    const [server] = await db.select().from(mcpServers).where(eq(mcpServers.id, id));
    return server || undefined;
  }

  async getAllMcpServers(): Promise<McpServer[]> {
    return await db.select().from(mcpServers).orderBy(desc(mcpServers.createdAt));
  }

  async createMcpServer(insertServer: InsertMcpServer): Promise<McpServer> {
    const [server] = await db.insert(mcpServers).values(insertServer).returning();
    return server;
  }

  async updateMcpServer(id: number, updateData: Partial<InsertMcpServer>): Promise<McpServer | undefined> {
    const [server] = await db.update(mcpServers).set(updateData).where(eq(mcpServers.id, id)).returning();
    return server || undefined;
  }

  async deleteMcpServer(id: number): Promise<boolean> {
    const result = await db.delete(mcpServers).where(eq(mcpServers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const totalLeadsQuery = await db.select({ count: sql<number>`count(*)` }).from(leads);
    const totalLeads = totalLeadsQuery[0]?.count || 0;

    const wonLeadsQuery = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.status, 'won'));
    const wonLeads = wonLeadsQuery[0]?.count || 0;

    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    const pipelineValueQuery = await db.select({ 
      sum: sql<number>`coalesce(sum(value), 0)` 
    }).from(leads).where(sql`status NOT IN ('won', 'lost')`);
    const pipelineValue = pipelineValueQuery[0]?.sum || 0;

    const activeProjectsQuery = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.status, 'won'));
    const activeProjects = activeProjectsQuery[0]?.count || 0;

    const leadsByStatusQuery = await db.select({
      status: leads.status,
      count: sql<number>`count(*)`
    }).from(leads).groupBy(leads.status);

    const leadsByStatus = leadsByStatusQuery.map(row => ({
      status: row.status,
      count: Number(row.count)
    }));

    // Revenue by month (simplified - using won leads created date)
    const revenueByMonthQuery = await db.select({
      month: sql<string>`to_char(created_at, 'YYYY-MM')`,
      revenue: sql<number>`coalesce(sum(value), 0)`
    }).from(leads).where(eq(leads.status, 'won')).groupBy(sql`to_char(created_at, 'YYYY-MM')`).orderBy(sql`to_char(created_at, 'YYYY-MM')`);

    const revenueByMonth = revenueByMonthQuery.map(row => ({
      month: row.month,
      revenue: Number(row.revenue)
    }));

    return {
      totalLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      pipelineValue,
      activeProjects,
      leadsByStatus,
      revenueByMonth
    };
  }

  // Database Management
  async exportDatabase(): Promise<DatabaseExport> {
    const [usersData, productsData, leadsData, interactionsData, webhooksData, attachmentsData, mcpServersData] = await Promise.all([
      db.select().from(users),
      db.select().from(products),
      db.select().from(leads),
      db.select().from(interactions),
      db.select().from(webhooks),
      db.select().from(leadAttachments),
      db.select().from(mcpServers)
    ]);

    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      data: {
        users: usersData,
        products: productsData,
        leads: leadsData,
        interactions: interactionsData,
        webhooks: webhooksData,
        leadAttachments: attachmentsData,
        mcpServers: mcpServersData
      }
    };
  }

  async importDatabase(data: DatabaseExport): Promise<boolean> {
    try {
      // Clear all existing data first
      await this.deleteDatabase();

      // Import data in the correct order (respecting foreign key constraints)
      // First import independent tables
      if (data.data.users?.length > 0) {
        for (const user of data.data.users) {
          const { id, createdAt, updatedAt, ...insertData } = user;
          await db.insert(users).values(insertData);
        }
      }

      if (data.data.products?.length > 0) {
        for (const product of data.data.products) {
          const { id, createdAt, ...insertData } = product;
          await db.insert(products).values(insertData);
        }
      }

      if (data.data.webhooks?.length > 0) {
        for (const webhook of data.data.webhooks) {
          const { id, createdAt, lastTriggered, ...insertData } = webhook;
          await db.insert(webhooks).values(insertData);
        }
      }

      if (data.data.mcpServers?.length > 0) {
        for (const server of data.data.mcpServers) {
          const { id, createdAt, ...insertData } = server;
          await db.insert(mcpServers).values(insertData);
        }
      }

      // Then import dependent tables
      if (data.data.leads?.length > 0) {
        for (const lead of data.data.leads) {
          const { id, createdAt, ...insertData } = lead;
          await db.insert(leads).values(insertData);
        }
      }

      if (data.data.interactions?.length > 0) {
        for (const interaction of data.data.interactions) {
          const { id, createdAt, ...insertData } = interaction;
          await db.insert(interactions).values(insertData);
        }
      }

      if (data.data.leadAttachments?.length > 0) {
        for (const attachment of data.data.leadAttachments) {
          const { id, createdAt, ...insertData } = attachment;
          await db.insert(leadAttachments).values(insertData);
        }
      }

      return true;
    } catch (error) {
      console.error('Database import failed:', error);
      return false;
    }
  }

  async deleteDatabase(): Promise<boolean> {
    try {
      // Delete in reverse order of dependencies
      await db.delete(leadAttachments);
      await db.delete(interactions);
      await db.delete(leads);
      await db.delete(webhooks);
      await db.delete(mcpServers);
      await db.delete(products);
      await db.delete(users);
      return true;
    } catch (error) {
      console.error('Database deletion failed:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
