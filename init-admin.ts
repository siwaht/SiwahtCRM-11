import { storage } from './server/storage';
import { hashPassword } from './server/auth-simple';

async function initializeAdmin() {
  try {
    console.log('Checking for existing admin user...');
    
    // Check if admin exists
    const existingAdmin = await storage.getUserByEmail('cc@siwaht.com');
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const hashedPassword = await hashPassword('Hola173!');
    const admin = await storage.createUser({
      name: 'Admin User',
      email: 'cc@siwaht.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
    
    console.log('Admin user created successfully!');
    console.log('Email: cc@siwaht.com');
    console.log('Password: Hola173!');
    console.log('Please change the password after first login.');
    
  } catch (error) {
    console.error('Error initializing admin:', error);
  } finally {
    process.exit(0);
  }
}

initializeAdmin();