import { Server } from 'http';
import { WebSocketServer } from 'ws';

export function setupMcpServer(httpServer: Server) {
  const wss = new WebSocketServer({ 
    port: 5003,
    host: '0.0.0.0'
  });

  wss.on('connection', (ws) => {
    console.log('MCP WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('MCP message received:', data);

        // Echo back for now - implement MCP protocol later
        ws.send(JSON.stringify({
          id: data.id,
          result: {
            message: 'MCP server operational',
            timestamp: new Date().toISOString()
          }
        }));
      } catch (error) {
        console.error('MCP message parsing error:', error);
        ws.send(JSON.stringify({
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }));
      }
    });

    ws.on('close', () => {
      console.log('MCP WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('MCP WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      method: 'initialized',
      params: {
        protocolVersion: '1.0.0',
        capabilities: {
          logging: {},
          prompts: {},
          resources: {},
          tools: {}
        }
      }
    }));
  });

  console.log('MCP WebSocket server started on port 5003');
  return wss;
}