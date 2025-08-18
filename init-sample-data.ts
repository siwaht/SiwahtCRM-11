import { storage } from './server/storage';
import { hashPassword } from './server/auth-simple';

async function initializeSampleData() {
  try {
    console.log('Adding sample data...');
    
    // Check if products exist
    const existingProducts = await storage.getAllProducts();
    
    if (existingProducts.length === 0) {
      // Add sample products
      const products = [
        {
          name: 'AI Website Generator',
          price: '$2,999',
          pitch: 'Transform your business with a custom AI-powered website that adapts to your visitors',
          talkingPoints: 'Fully responsive design, SEO optimized, AI-powered content generation, Lightning fast performance',
          agentNotes: 'Great for small to medium businesses looking to establish online presence',
          priority: 'High' as const,
          profitLevel: 'High Profit' as const,
          tags: ['website', 'ai', 'automation'],
          displayOrder: 1,
          isActive: true
        },
        {
          name: 'AI Video Ads Creator',
          price: '$1,499',
          pitch: 'Create professional video ads in minutes with our AI-powered video generation platform',
          talkingPoints: 'Multiple templates, Auto voice-over, Social media optimization, Analytics tracking',
          agentNotes: 'Perfect for marketing teams and social media managers',
          priority: 'High' as const,
          profitLevel: 'Standard' as const,
          tags: ['video', 'advertising', 'ai'],
          displayOrder: 2,
          isActive: true
        },
        {
          name: 'AI Chat Agent',
          price: '$499/month',
          pitch: 'Deploy intelligent chat agents that handle customer support 24/7',
          talkingPoints: 'Natural language processing, Multi-language support, CRM integration, Real-time analytics',
          agentNotes: 'Ideal for customer service departments',
          priority: 'Medium' as const,
          profitLevel: 'High Profit' as const,
          tags: ['chat', 'support', 'automation'],
          displayOrder: 3,
          isActive: true
        },
        {
          name: 'Voice AI Assistant',
          price: '$799/month',
          pitch: 'Advanced voice AI system for phone support and virtual assistance',
          talkingPoints: 'Natural voice synthesis, Call routing, Appointment scheduling, Integration with existing systems',
          agentNotes: 'Best for healthcare, legal, and professional services',
          priority: 'Medium' as const,
          profitLevel: 'Standard' as const,
          tags: ['voice', 'ai', 'assistant'],
          displayOrder: 4,
          isActive: true
        }
      ];
      
      for (const product of products) {
        await storage.createProduct(product);
        console.log(`Created product: ${product.name}`);
      }
    }
    
    // No test users created - only admin account exists
    
    // Get admin user for lead assignment
    const admin = await storage.getUserByEmail('cc@siwaht.com');
    const products = await storage.getAllProducts();
    
    // Check if leads exist
    const existingLeads = await storage.getAllLeads();
    
    if (existingLeads.length === 0 && admin && products.length > 0) {
      // Add sample leads
      const leads = [
        {
          name: 'Tech Startup Inc',
          email: 'contact@techstartup.com',
          phone: '+1-555-0100',
          company: 'Tech Startup Inc',
          status: 'qualified' as const,
          source: 'Website',
          value: 15000,
          assignedTo: admin.id,
          assignedEngineer: admin.id,
          notes: 'Interested in complete AI solution package',
          priority: 'high' as const,
          score: 85,
          engineeringProgress: 30,
          tags: ['hot-lead', 'enterprise'],
        },
        {
          name: 'Digital Marketing Co',
          email: 'info@digitalmarketing.com',
          phone: '+1-555-0101',
          company: 'Digital Marketing Co',
          status: 'proposal' as const,
          source: 'Referral',
          value: 8500,
          assignedTo: admin.id,
          notes: 'Looking for AI video ad creator and chat agent',
          priority: 'medium' as const,
          score: 70,
          tags: ['marketing', 'referral'],
        },
        {
          name: 'E-commerce Solutions',
          email: 'sales@ecommerce.com',
          phone: '+1-555-0102',
          company: 'E-commerce Solutions',
          status: 'new' as const,
          source: 'Cold Call',
          value: 5000,
          assignedTo: agent.id,
          notes: 'Initial contact made, scheduling demo',
          priority: 'medium' as const,
          score: 50,
          tags: ['e-commerce', 'new'],
        },
        {
          name: 'Healthcare Plus',
          email: 'admin@healthcareplus.com',
          phone: '+1-555-0103',
          company: 'Healthcare Plus',
          status: 'negotiation' as const,
          source: 'Trade Show',
          value: 25000,
          assignedTo: agent.id,
          assignedEngineer: engineer?.id,
          notes: 'Needs voice AI for patient scheduling',
          priority: 'high' as const,
          score: 90,
          engineeringProgress: 60,
          engineeringNotes: 'Custom integration with their EMR system required',
          tags: ['healthcare', 'enterprise', 'priority'],
        },
        {
          name: 'Local Restaurant Chain',
          email: 'owner@restaurant.com',
          phone: '+1-555-0104',
          company: 'Restaurant Chain LLC',
          status: 'contacted' as const,
          source: 'Email Campaign',
          value: 3500,
          assignedTo: agent.id,
          notes: 'Interested in website and chat support',
          priority: 'low' as const,
          score: 40,
          tags: ['restaurant', 'small-business'],
        }
      ];
      
      for (const lead of leads) {
        const createdLead = await storage.createLead(lead);
        console.log(`Created lead: ${lead.name}`);
        
        // Associate products with leads
        if (createdLead && products.length > 0) {
          // Add 1-2 random products to each lead
          const numProducts = Math.floor(Math.random() * 2) + 1;
          const productIds = products.slice(0, numProducts).map(p => p.id);
          await storage.addLeadProducts(createdLead.id, productIds);
        }
      }
    }
    
    console.log('Sample data initialization complete!');
    console.log('\nAvailable login credentials:');
    console.log('Admin: admin@siwaht.com / admin123');
    console.log('Agent: agent@siwaht.com / agent123');
    console.log('Engineer: engineer@siwaht.com / engineer123');
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
  } finally {
    process.exit(0);
  }
}

initializeSampleData();