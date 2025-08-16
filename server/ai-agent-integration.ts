import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { insertLeadSchema, insertInteractionSchema } from '@shared/schema';

interface McpMessage {
  id: string;
  method: string;
  params?: any;
}

interface McpResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export function setupMcpServer(httpServer: Server) {
  // Create WebSocket server on port 5003 for MCP
  const wss = new WebSocketServer({ 
    port: 5003,
    host: '0.0.0.0'
  });

  console.log('MCP WebSocket server started on port 5003');

  wss.on('connection', (ws: WebSocket) => {
    console.log('MCP client connected');

    ws.on('message', async (data: Buffer) => {
      try {
        const message: McpMessage = JSON.parse(data.toString());
        const response = await handleMcpMessage(message);
        ws.send(JSON.stringify(response));
      } catch (error) {
        console.error('MCP message handling error:', error);
        const errorResponse: McpResponse = {
          id: 'unknown',
          error: {
            code: -32603,
            message: 'Internal error'
          }
        };
        ws.send(JSON.stringify(errorResponse));
      }
    });

    ws.on('close', () => {
      console.log('MCP client disconnected');
    });

    // Send welcome message
    ws.send(JSON.stringify({
      id: 'welcome',
      result: {
        tools: [
          'create_lead',
          'get_leads', 
          'update_lead',
          'add_interaction',
          'get_analytics',
          'manage_products'
        ]
      }
    }));
  });
}

async function handleMcpMessage(message: McpMessage): Promise<McpResponse> {
  try {
    switch (message.method) {
      case 'create_lead':
        return await createLead(message);
      
      case 'get_leads':
        return await getLeads(message);
      
      case 'update_lead':
        return await updateLead(message);
      
      case 'add_interaction':
        return await addInteraction(message);
      
      case 'get_analytics':
        return await getAnalytics(message);
      
      case 'manage_products':
        return await manageProducts(message);
      
      default:
        return {
          id: message.id,
          error: {
            code: -32601,
            message: `Method '${message.method}' not found`
          }
        };
    }
  } catch (error) {
    console.error(`Error handling MCP method ${message.method}:`, error);
    return {
      id: message.id,
      error: {
        code: -32603,
        message: 'Internal error'
      }
    };
  }
}

async function createLead(message: McpMessage): Promise<McpResponse> {
  try {
    const leadData = insertLeadSchema.parse(message.params);
    const lead = await storage.createLead(leadData);
    
    return {
      id: message.id,
      result: {
        success: true,
        lead: lead,
        message: `Lead created successfully: ${lead.name}`
      }
    };
  } catch (error) {
    return {
      id: message.id,
      error: {
        code: -32602,
        message: `Invalid parameters: ${error}`
      }
    };
  }
}

async function getLeads(message: McpMessage): Promise<McpResponse> {
  try {
    const filters = message.params?.filters || {};
    const leads = await storage.getAllLeads(filters);
    
    return {
      id: message.id,
      result: {
        leads: leads,
        count: leads.length,
        filters: filters
      }
    };
  } catch (error) {
    return {
      id: message.id,
      error: {
        code: -32603,
        message: 'Failed to retrieve leads'
      }
    };
  }
}

async function updateLead(message: McpMessage): Promise<McpResponse> {
  try {
    const { leadId, updates } = message.params;
    
    if (!leadId) {
      return {
        id: message.id,
        error: {
          code: -32602,
          message: 'Lead ID is required'
        }
      };
    }

    const lead = await storage.updateLead(leadId, updates);
    
    if (!lead) {
      return {
        id: message.id,
        error: {
          code: -32603,
          message: 'Lead not found'
        }
      };
    }

    return {
      id: message.id,
      result: {
        success: true,
        lead: lead,
        message: `Lead updated successfully: ${lead.name}`
      }
    };
  } catch (error) {
    return {
      id: message.id,
      error: {
        code: -32603,
        message: 'Failed to update lead'
      }
    };
  }
}

async function addInteraction(message: McpMessage): Promise<McpResponse> {
  try {
    const interactionData = insertInteractionSchema.parse(message.params);
    const interaction = await storage.createInteraction(interactionData);
    
    return {
      id: message.id,
      result: {
        success: true,
        interaction: interaction,
        message: 'Interaction added successfully'
      }
    };
  } catch (error) {
    return {
      id: message.id,
      error: {
        code: -32602,
        message: `Invalid parameters: ${error}`
      }
    };
  }
}

async function getAnalytics(message: McpMessage): Promise<McpResponse> {
  try {
    const analytics = await storage.getAnalytics();
    
    return {
      id: message.id,
      result: {
        analytics: analytics,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      id: message.id,
      error: {
        code: -32603,
        message: 'Failed to retrieve analytics'
      }
    };
  }
}

async function manageProducts(message: McpMessage): Promise<McpResponse> {
  try {
    const { action } = message.params;
    
    switch (action) {
      case 'list':
        const products = await storage.getAllProducts();
        return {
          id: message.id,
          result: {
            products: products,
            count: products.length
          }
        };
      
      case 'get':
        const { productId } = message.params;
        const product = await storage.getProduct(productId);
        return {
          id: message.id,
          result: {
            product: product || null
          }
        };
      
      default:
        return {
          id: message.id,
          error: {
            code: -32602,
            message: `Unknown product action: ${action}`
          }
        };
    }
  } catch (error) {
    return {
      id: message.id,
      error: {
        code: -32603,
        message: 'Failed to manage products'
      }
    };
  }
}
