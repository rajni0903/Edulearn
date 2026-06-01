/**
 * =============================================================================
 * DATABASE CONNECTION — config/db.js
 * =============================================================================
 * MongoDB se connect karne ke liye ye file use hoti hai.
 * Mongoose ODM use karta hai — JavaScript objects ko MongoDB documents me
 * convert karta hai aur vice versa.
 *
 * MONGO_URI .env file se aata hai:
 *   - Development: mongodb://localhost:27017/edulearn
 *   - Production:  MongoDB Atlas URL
 * =============================================================================
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB se connect karo — URI .env se lo
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,  // Naya URL parser use karo
      useUnifiedTopology: true,  // Naya topology engine use karo
    });

    // Success message — kaunse server se connected hai
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    // Connection fail — server start nahi hoga
    console.error(`❌ MongoDB Connection FAILED: ${error.message}`);
    console.error('   Make sure MongoDB is running on your system!');
    console.error('   Start MongoDB: net start MongoDB (Windows) or brew services start mongodb-community (Mac)');
    process.exit(1); // Exit with failure code — nodemon restart karega
  }
};

module.exports = connectDB;
