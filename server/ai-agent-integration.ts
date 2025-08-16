import { Server } from 'http';
import { WebSocketServer } from 'ws';

interface McpRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

interface McpResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export function setupMcpServer(httpServer: Server) {
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/mcp'
  });

  const connectedClients = new Set();

  wss.on('connection', (ws) => {
    console.log('MCP WebSocket client connected');
    connectedClients.add(ws);

    ws.on('message', (message) => {
      try {
        const request: McpRequest = JSON.parse(message.toString());
        console.log('MCP message received:', request);

        let response: McpResponse;

        switch (request.method) {
          case 'initialize':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                protocolVersion: '1.0.0',
                capabilities: {
                  logging: {},
                  prompts: {
                    listChanged: true
                  },
                  resources: {
                    subscribe: true,
                    listChanged: true
                  },
                  tools: {
                    listChanged: true
                  }
                },
                serverInfo: {
                  name: 'Siwaht CRM MCP Server',
                  version: '1.0.0'
                }
              }
            };
            break;

          case 'prompts/list':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                prompts: [
                  {
                    name: 'analyze_lead',
                    description: 'Analyze lead data and provide insights',
                    arguments: [
                      {
                        name: 'lead_data',
                        description: 'Lead information to analyze',
                        required: true
                      }
                    ]
                  },
                  {
                    name: 'suggest_followup',
                    description: 'Suggest follow-up actions for a lead',
                    arguments: [
                      {
                        name: 'lead_status',
                        description: 'Current lead status',
                        required: true
                      },
                      {
                        name: 'last_interaction',
                        description: 'Last interaction details',
                        required: false
                      }
                    ]
                  }
                ]
              }
            };
            break;

          case 'tools/list':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                tools: [
                  {
                    name: 'get_leads',
                    description: 'Retrieve leads from CRM',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' },
                        limit: { type: 'number' }
                      }
                    }
                  },
                  {
                    name: 'create_lead',
                    description: 'Create a new lead in CRM',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        email: { type: 'string' },
                        company: { type: 'string' },
                        status: { type: 'string' }
                      },
                      required: ['name', 'email']
                    }
                  },
                  {
                    name: 'update_lead_status',
                    description: 'Update lead status',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        lead_id: { type: 'number' },
                        status: { type: 'string' }
                      },
                      required: ['lead_id', 'status']
                    }
                  }
                ]
              }
            };
            break;

          case 'resources/list':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                resources: [
                  {
                    uri: 'crm://leads',
                    name: 'Leads Database',
                    description: 'Access to CRM leads data',
                    mimeType: 'application/json'
                  },
                  {
                    uri: 'crm://products',
                    name: 'Product Catalog',
                    description: 'Available AI service products',
                    mimeType: 'application/json'
                  },
                  {
                    uri: 'crm://analytics',
                    name: 'Analytics Data',
                    description: 'CRM analytics and metrics',
                    mimeType: 'application/json'
                  }
                ]
              }
            };
            break;

          case 'ping':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                status: 'ok',
                timestamp: new Date().toISOString()
              }
            };
            break;

          default:
            response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32601,
                message: `Method not found: ${request.method}`
              }
            };
        }

        ws.send(JSON.stringify(response));
      } catch (error) {
        console.error('MCP message parsing error:', error);
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'error',
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }));
      }
    });

    ws.on('close', () => {
      console.log('MCP WebSocket client disconnected');
      connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('MCP WebSocket error:', error);
      connectedClients.delete(ws);
    });

    // Send notification that server is ready
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }));
  });

  console.log('MCP WebSocket server started on /mcp path');
  
  // Return server info for monitoring
  return {
    wss,
    getConnectedClients: () => connectedClients.size,
    broadcast: (message: any) => {
      const data = JSON.stringify(message);
      connectedClients.forEach((ws: any) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(data);
        }
      });
    }
  };
}