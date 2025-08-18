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
    
    // No sample leads created - start with a clean database
    
    console.log('Sample data initialization complete!');
    console.log('\nAvailable login credentials:');
    console.log('Admin: cc@siwaht.com / Hola173!');
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
  } finally {
    process.exit(0);
  }
}

initializeSampleData();