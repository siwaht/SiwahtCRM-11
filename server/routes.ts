import type { Express } from "express";
import { createServer, type Server } from "http";
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import { storage } from "./storage";
import { login, logout, getCurrentUser, requireAuth, requireRole, hashPassword } from './auth-simple';
import { insertUserSchema, insertLeadSchema, insertProductSchema, insertInteractionSchema, insertWebhookSchema } from '@shared/schema';
import type { DatabaseExport } from './storage';
import { triggerWebhooks } from './webhooks';
import { setupMcpServer } from './ai-agent-integration';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
import { ObjectPermission } from './objectAcl';
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
      pool: pool as any,
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
      
      // Trigger webhooks
      await triggerWebhooks('user.created', userWithoutPassword);
      
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
      
      // Trigger webhooks
      await triggerWebhooks('user.updated', userWithoutPassword);
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  app.delete('/api/users/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get user before deleting for webhook
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      // Trigger webhooks
      await triggerWebhooks('user.deleted', userWithoutPassword);
      
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
      
      // Trigger webhooks
      await triggerWebhooks('product.created', product);
      
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
      
      // Trigger webhooks
      await triggerWebhooks('product.updated', product);
      
      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(400).json({ message: 'Invalid product data' });
    }
  });

  app.delete('/api/products/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get product before deleting for webhook
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Trigger webhooks
      await triggerWebhooks('product.deleted', product);
      
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
      
      // Get the lead before deleting for webhook
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      const success = await storage.deleteLead(id);
      if (!success) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Trigger webhooks
      await triggerWebhooks('lead.deleted', lead);
      
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
      console.log('Creating interaction for lead:', leadId);
      console.log('Request body:', req.body);
      console.log('User ID from session:', req.session.userId);
      
      if (!req.session.userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const interactionData = insertInteractionSchema.parse({
        ...req.body,
        leadId,
        userId: req.session.userId
      });
      
      console.log('Parsed interaction data:', interactionData);
      
      const interaction = await storage.createInteraction(interactionData);
      
      // Trigger webhooks
      await triggerWebhooks('interaction.created', interaction);
      
      res.status(201).json(interaction);
    } catch (error) {
      console.error('Create interaction error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.status(400).json({ 
        message: 'Invalid interaction data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put('/api/interactions/:id', requireAuth, async (req, res) => {
    try {
      const interactionId = parseInt(req.params.id);
      const updateData = insertInteractionSchema.partial().parse(req.body);
      
      const interaction = await storage.updateInteraction(interactionId, updateData);
      
      if (!interaction) {
        return res.status(404).json({ message: 'Interaction not found' });
      }

      // Trigger webhooks
      await triggerWebhooks('interaction.updated', interaction);
      
      res.json(interaction);
    } catch (error) {
      console.error('Update interaction error:', error);
      res.status(400).json({ message: 'Invalid interaction data' });
    }
  });

  // Get all interactions for admin panel MCP section
  app.get('/api/interactions/all', requireAuth, async (req, res) => {
    try {
      const interactions = await storage.getAllInteractions();
      res.json(interactions);
    } catch (error) {
      console.error('Get all interactions error:', error);
      res.status(500).json({ message: 'Failed to get interactions' });
    }
  });

  app.delete('/api/interactions/:id', requireAuth, async (req, res) => {
    try {
      const interactionId = parseInt(req.params.id);
      
      // Get the interaction before deleting for webhook
      const interaction = await storage.getInteraction(interactionId);
      if (!interaction) {
        return res.status(404).json({ message: 'Interaction not found' });
      }
      
      const success = await storage.deleteInteraction(interactionId);
      if (!success) {
        return res.status(404).json({ message: 'Interaction not found' });
      }

      // Trigger webhooks
      await triggerWebhooks('interaction.deleted', interaction);
      
      res.json({ message: 'Interaction deleted successfully' });
    } catch (error) {
      console.error('Delete interaction error:', error);
      res.status(500).json({ message: 'Internal server error' });
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

  app.delete('/api/lead-attachments/:id', requireAuth, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const result = await storage.deleteLeadAttachment(attachmentId);
      
      if (result.success && result.fileSize && result.uploadedById) {
        // Update user's storage usage
        const user = await storage.getUser(result.uploadedById);
        if (user) {
          const newStorageUsed = Math.max(0, (user.storageUsed || 0) - result.fileSize);
          await storage.updateUserStorage(result.uploadedById, newStorageUsed);
        }
        res.json({ success: true });
      } else if (result.success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Attachment not found' });
      }
    } catch (error) {
      console.error('Delete attachment error:', error);
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

  // Database Management (Admin only)
  app.get('/api/database/export', requireRole('admin'), async (req, res) => {
    try {
      const exportData = await storage.exportDatabase();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="siwaht-crm-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error('Database export error:', error);
      res.status(500).json({ message: 'Failed to export database' });
    }
  });

  app.post('/api/database/import', requireRole('admin'), upload.single('database'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const importData: DatabaseExport = JSON.parse(fileContent);

      // Validate the import data structure
      if (!importData.version || !importData.data) {
        return res.status(400).json({ message: 'Invalid database export format' });
      }

      const success = await storage.importDatabase(importData);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      if (success) {
        res.json({ message: 'Database imported successfully' });
      } else {
        res.status(500).json({ message: 'Failed to import database' });
      }
    } catch (error) {
      console.error('Database import error:', error);
      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
      }
      res.status(500).json({ message: 'Failed to import database' });
    }
  });

  app.delete('/api/database', requireRole('admin'), async (req, res) => {
    try {
      const success = await storage.deleteDatabase();
      if (success) {
        res.json({ message: 'Database cleared successfully' });
      } else {
        res.status(500).json({ message: 'Failed to clear database' });
      }
    } catch (error) {
      console.error('Database deletion error:', error);
      res.status(500).json({ message: 'Failed to clear database' });
    }
  });

  // Object Storage Routes
  // Endpoint for getting the upload URL for file uploads
  app.post('/api/objects/upload', requireAuth, async (req, res) => {
    console.log('Upload URL request from user:', req.session.userId);
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log('Generated upload URL successfully');
      res.json({ 
        method: 'PUT',
        url: uploadURL,
        uploadURL: uploadURL 
      });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  });

  // Endpoint for serving private objects with ACL check
  app.get('/objects/:objectPath(*)', requireAuth, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = req.session.userId.toString();
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error('Error checking object access:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get user storage usage
  app.get('/api/user/storage', async (req, res) => {
    try {
      // Get current user from session
      if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        storageUsed: user.storageUsed || 0,
        storageLimit: user.storageLimit || 524288000, // 500MB default
        storageAvailable: (user.storageLimit || 524288000) - (user.storageUsed || 0)
      });
    } catch (error) {
      console.error('Error getting storage usage:', error);
      res.status(500).json({ error: 'Failed to get storage usage' });
    }
  });

  // Endpoint for updating file metadata after upload
  app.put('/api/lead-attachments', async (req, res) => {
    if (!req.body.fileURL || !req.body.leadId || !req.body.fileSize) {
      return res.status(400).json({ error: 'fileURL, leadId, and fileSize are required' });
    }

    // Get current user from session
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.session.userId;

    try {
      // Get current user storage info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const fileSize = parseInt(req.body.fileSize);
      const currentUsage = user.storageUsed || 0;
      const storageLimit = user.storageLimit || 524288000; // 500MB

      // Check if adding this file would exceed storage limit
      if (currentUsage + fileSize > storageLimit) {
        return res.status(413).json({ 
          error: 'Storage limit exceeded',
          storageUsed: currentUsage,
          storageLimit: storageLimit,
          fileSize: fileSize
        });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.fileURL,
        {
          owner: userId.toString(),
          visibility: "private", // Lead attachments should be private
        }
      );

      // Update user's storage usage
      await storage.updateUserStorage(userId, currentUsage + fileSize);

      // Save file metadata to database
      await storage.addLeadAttachment({
        leadId: parseInt(req.body.leadId),
        fileName: req.body.fileName || 'Uploaded file',
        filePath: objectPath,
        uploadedById: userId,
        fileSize: fileSize,
        description: req.body.description || null
      });

      res.json({
        success: true,
        objectPath: objectPath,
        message: 'File uploaded successfully',
        newStorageUsed: currentUsage + fileSize
      });
    } catch (error) {
      console.error('Error setting file ACL:', error);
      res.status(500).json({ error: 'Failed to process file upload' });
    }
  });

  const httpServer = createServer(app);

  // Setup MCP WebSocket server
  setupMcpServer(httpServer);

  return httpServer;
}
