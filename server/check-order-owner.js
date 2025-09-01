import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkOrderOwner() {
  try {
    console.log('🔍 Checking Order ID 1 ownership...\n');
    
    // Get order details
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = 1');
    
    if (orders.length === 0) {
      console.log('❌ Order ID 1 does not exist!');
      return;
    }
    
    const order = orders[0];
    console.log('📦 Order ID 1 Details:');
    console.log(`   - Buyer User ID: ${order.buyer_user_id}`);
    console.log(`   - Farmer User ID: ${order.farmer_user_id}`);
    console.log(`   - Status: ${order.status}`);
    console.log(`   - Created: ${order.created_at}\n`);
    
    // Get user details
    const [users] = await pool.query(
      'SELECT id, full_name, role, email FROM users WHERE id IN (?, ?)',
      [order.buyer_user_id, order.farmer_user_id]
    );
    
    console.log('👥 Users involved:');
    users.forEach(user => {
      const type = user.id === order.buyer_user_id ? 'BUYER' : 'FARMER';
      console.log(`   - ${type}: ID ${user.id} (${user.full_name}) - ${user.role} - ${user.email}`);
    });
    
    console.log('\n💡 To update this order, you need a dev token for:');
    console.log(`   - User ID ${order.farmer_user_id} (the farmer) - to confirm/ship/complete`);
    console.log(`   - User ID ${order.buyer_user_id} (the buyer) - to cancel (if pending)`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkOrderOwner();
