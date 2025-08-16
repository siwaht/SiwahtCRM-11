import type { Express } from "express";
import { createServer, type Server } from "http";
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import { storage } from "./storage";
import { login, logout, getCurrentUser, requireAuth, requireRole, hashPassword } from './auth-simple';
import { insertUserSchema, insertLeadSchema, insertProductSchema, insertInteractionSchema, insertWebhookSchema } from '@shared/schema';
import { triggerWebhooks } from './webhooks';
import { setupMcpServer } from './ai-agent-integration';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup PostgreSQL session store
  const PostgreSqlStore = connectPgSimple(session);
  
  // Session middleware with PostgreSQL store
  app.use(session({
    store: new PostgreSqlStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-dev-12345',
    resave: false,
    saveUninitialized: false,
    name: 'siwaht.sid',
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    }
  }));

  // Auth routes
  app.post('/api/login', login);
  app.post('/api/logout', logout);
  app.get('/api/me', getCurrentUser);

  // User management (Admin only)
  app.get('/api/users', requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/users', requireRole('admin'), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  app.put('/api/users/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  app.delete('/api/users/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Products (Admin only for CUD, Agents can read)
  app.get('/api/products', requireAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/products', requireRole('admin'), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(400).json({ message: 'Invalid product data' });
    }
  });

  app.put('/api/products/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = req.body;
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(400).json({ message: 'Invalid product data' });
    }
  });

  app.delete('/api/products/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/products/reorder', requireRole('admin'), async (req, res) => {
    try {
      const { productIds } = req.body;
      const success = await storage.reorderProducts(productIds);
      if (!success) {
        return res.status(400).json({ message: 'Failed to reorder products' });
      }
      res.json({ message: 'Products reordered successfully' });
    } catch (error) {
      console.error('Reorder products error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Leads
  app.get('/api/leads', requireAuth, async (req, res) => {
    try {
      const { status, assignedTo, source, search, priority } = req.query;
      const filters = {
        ...(status && { status: status as string }),
        ...(assignedTo && { assignedTo: parseInt(assignedTo as string) }),
        ...(source && { source: source as string }),
        ...(search && { search: search as string }),
        ...(priority && { priority: priority as string }),
      };
      
      const leads = await storage.getAllLeads(filters);
      res.json(leads);
    } catch (error) {
      console.error('Get leads error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/leads', requireAuth, async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      
      // Trigger webhooks
      await triggerWebhooks('lead.created', lead);
      
      res.status(201).json(lead);
    } catch (error) {
      console.error('Create lead error:', error);
      res.status(400).json({ message: 'Invalid lead data' });
    }
  });

  app.put('/api/leads/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const leadData = req.body;
      const originalLead = await storage.getLead(id);
      
      const lead = await storage.updateLead(id, leadData);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Trigger webhooks
      await triggerWebhooks('lead.updated', lead);
      if (originalLead && originalLead.status !== lead.status) {
        await triggerWebhooks('lead.status_changed', lead);
      }
      
      res.json(lead);
    } catch (error) {
      console.error('Update lead error:', error);
      res.status(400).json({ message: 'Invalid lead data' });
    }
  });

  app.delete('/api/leads/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLead(id);
      if (!success) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete lead error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Interactions
  app.get('/api/leads/:id/interactions', requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const interactions = await storage.getInteractionsByLead(leadId);
      res.json(interactions);
    } catch (error) {
      console.error('Get interactions error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/leads/:id/interactions', requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const interactionData = insertInteractionSchema.parse({
        ...req.body,
        leadId,
        userId: req.user!.id
      });
      
      const interaction = await storage.createInteraction(interactionData);
      
      // Trigger webhooks
      await triggerWebhooks('interaction.created', interaction);
      
      res.status(201).json(interaction);
    } catch (error) {
      console.error('Create interaction error:', error);
      res.status(400).json({ message: 'Invalid interaction data' });
    }
  });

  // Lead Attachments
  app.post('/api/leads/:id/attachments', requireAuth, upload.single('file'), async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const attachment = await storage.createLeadAttachment({
        leadId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedById: req.user!.id
      });

      res.status(201).json(attachment);
    } catch (error) {
      console.error('Upload attachment error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/leads/:id/attachments', requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const attachments = await storage.getAttachmentsByLead(leadId);
      res.json(attachments);
    } catch (error) {
      console.error('Get attachments error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Webhooks (Admin only)
  app.get('/api/webhooks', requireRole('admin'), async (req, res) => {
    try {
      const webhooks = await storage.getAllWebhooks();
      res.json(webhooks);
    } catch (error) {
      console.error('Get webhooks error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/webhooks', requireRole('admin'), async (req, res) => {
    try {
      const webhookData = insertWebhookSchema.parse(req.body);
      const webhook = await storage.createWebhook(webhookData);
      res.status(201).json(webhook);
    } catch (error) {
      console.error('Create webhook error:', error);
      res.status(400).json({ message: 'Invalid webhook data' });
    }
  });

  app.put('/api/webhooks/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const webhookData = req.body;
      const webhook = await storage.updateWebhook(id, webhookData);
      if (!webhook) {
        return res.status(404).json({ message: 'Webhook not found' });
      }
      res.json(webhook);
    } catch (error) {
      console.error('Update webhook error:', error);
      res.status(400).json({ message: 'Invalid webhook data' });
    }
  });

  app.delete('/api/webhooks/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWebhook(id);
      if (!success) {
        return res.status(404).json({ message: 'Webhook not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete webhook error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/webhooks/:id/test', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const webhook = await storage.getWebhook(id);
      if (!webhook) {
        return res.status(404).json({ message: 'Webhook not found' });
      }

      // Test webhook with dummy data
      const testData = { test: true, timestamp: new Date().toISOString() };
      await triggerWebhooks('test', testData, [webhook]);
      
      res.json({ message: 'Test webhook sent successfully' });
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Analytics
  app.get('/api/analytics', requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  // Setup MCP WebSocket server
  setupMcpServer(httpServer);

  return httpServer;
}
