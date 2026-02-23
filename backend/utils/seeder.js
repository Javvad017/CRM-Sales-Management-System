/**
 * Database Seeder
 * Seeds an admin user into the database.
 * Run: npm run seed
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
    await connectDB();

    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists. Skipping seed.');
        } else {
            const admin = await User.create({
                name: process.env.ADMIN_NAME || 'Super Admin',
                email: process.env.ADMIN_EMAIL || 'admin@crm.com',
                password: process.env.ADMIN_PASSWORD || 'Admin@123456',
                role: 'admin',
                isVerified: true,
                isActive: true,
            });

            console.log(`✅ Admin seeded: ${admin.email}`);
        }
    } catch (error) {
        console.error('❌ Seeder error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB disconnected after seeding.');
        process.exit(0);
    }
};

seedAdmin();
