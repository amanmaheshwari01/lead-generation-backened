import bcrypt from 'bcryptjs'
import Shop from './models/shop.js'
import User from './models/user.js'
import { connectDB } from './config/db.js'

const seedDatabase = async () => {
  try {
    //connect DB
    await connectDB();
    
    // Clear existing data to prevent duplicates on multiple runs
    await Shop.deleteMany({});
    await User.deleteMany({});
    console.log(' Cleared existing database records');

    // Generate a secure hash for the password "password123"
    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('password123', salt);

    // --- CREATE TENANT (SHOP) ---
    const mainShop = await Shop.create({
      name: 'Downtown Retail Boutique',
      subscriptionStatus: 'Active',
    });
    console.log(` Created Shop: ${mainShop.name}`);

    // --- CREATE USERS ---
    const usersToCreate = [
      {
        name: 'Platform Owner',
        email: 'super@admin.com',
        passwordHash: commonPasswordHash,
        role: 'Super Admin',
        // Super Admins don't belong to a specific shop
      },
      {
        name: 'Sarah Manager',
        email: 'admin@shop.com',
        passwordHash: commonPasswordHash,
        role: 'Shop Admin',
        shopId: mainShop._id, // Assign to the shop we just created
      },
      {
        name: 'John Floorstaff',
        email: 'employee@shop.com',
        passwordHash: commonPasswordHash,
        role: 'Employee',
        shopId: mainShop._id, // Assign to the shop we just created
      }
    ];

    await User.insertMany(usersToCreate);
    console.log('Created 3 Test Users successfully.');

    console.log('\n=======================================');
    console.log('SEEDING COMPLETE! You can now log in with:');
    console.log('Password for all accounts: password123');
    console.log('Super Admin : super@admin.com');
    console.log('Shop Admin  : admin@shop.com');
    console.log('Employee    : employee@shop.com');
    console.log('=======================================\n');

    process.exit(0);
  } catch (error) {
    console.error(' Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();