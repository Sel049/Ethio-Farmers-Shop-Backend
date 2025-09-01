import { pool } from "../config/db.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { items, listing_id, quantity, deliveryFee = 0, notes, delivery_address, delivery_preferences, payment_method } = req.body;

    // Handle both new format (items array) and legacy format (single listing_id)
    let orderItems = [];
    
    if (items && Array.isArray(items) && items.length > 0) {
      // New format: items array
      orderItems = items;
    } else if (listing_id && quantity) {
      // Legacy format: single listing_id and quantity
      orderItems = [{
        listingId: listing_id,
        quantity: quantity
      }];
    } else {
      return res.status(400).json({ 
        error: "Order must contain at least one item. Use 'items' array or 'listing_id' with 'quantity'" 
      });
    }

    // Get user ID and verify role
    let userId, userRole;
    
    if (uid.startsWith('dev-uid-')) {
      // Dev user - use the ID from the token
      userId = req.user.id;
      userRole = req.user.role;
    } else {
      // Real Firebase user - look up in database
      const [userRows] = await pool.query(
        "SELECT id, role FROM users WHERE firebase_uid = ?",
        [uid]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      userId = userRows[0].id;
      userRole = userRows[0].role;
    }

    if (userRole !== 'buyer') {
      return res.status(403).json({ error: "Only buyers can create orders" });
    }

    const buyerId = userId;

    // Validate items and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const { listingId, quantity } = item;

      // Get listing details
      const [listings] = await pool.query(
        "SELECT * FROM produce_listings WHERE id = ? AND status = 'active'",
        [listingId]
      );

      if (listings.length === 0) {
        return res.status(400).json({ error: `Listing ${listingId} not found or inactive` });
      }

      const listing = listings[0];

      if (quantity > listing.quantity) {
        return res.status(400).json({ 
          error: `Requested quantity (${quantity}) exceeds available quantity (${listing.quantity}) for ${listing.title}` 
        });
      }

      const lineTotal = listing.price_per_unit * quantity;
      subtotal += lineTotal;

      validatedItems.push({
        listingId,
        listing,
        quantity,
        lineTotal
      });
    }

    const total = subtotal + deliveryFee;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create order
      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          buyer_user_id, farmer_user_id, status, subtotal, 
          delivery_fee, currency, notes
        ) VALUES (?, ?, 'pending', ?, ?, 'ETB', ?)`,
        [buyerId, validatedItems[0].listing.farmer_user_id, subtotal, deliveryFee, notes]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of validatedItems) {
        await connection.query(
          `INSERT INTO order_items (
            order_id, listing_id, crop, unit, price_per_unit, quantity
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.listingId,
            item.listing.crop,
            item.listing.unit,
            item.listing.price_per_unit,
            item.quantity
          ]
        );

        // Update listing quantity
        await connection.query(
          `UPDATE produce_listings 
           SET quantity = quantity - ? 
           WHERE id = ?`,
          [item.quantity, item.listingId]
        );
      }

      // Commit transaction
      await connection.commit();

      // Get the created order with details
      const [orderDetails] = await pool.query(
        `SELECT 
          o.*,
          u.full_name as buyer_name,
          u.phone as buyer_phone,
          f.full_name as farmer_name,
          f.phone as farmer_phone
        FROM orders o
        JOIN users u ON o.buyer_user_id = u.id
        JOIN users f ON o.farmer_user_id = f.id
        WHERE o.id = ?`,
        [orderId]
      );

      res.status(201).json({
        message: "Order created successfully",
        order: {
          id: orderId,
          ...orderDetails[0],
          items: validatedItems.map(item => ({
            listing_id: item.listingId,
            crop: item.listing.crop,
            quantity: item.quantity,
            unit: item.listing.unit,
            price_per_unit: item.listing.price_per_unit,
            line_total: item.lineTotal
          })),
          subtotal,
          delivery_fee: deliveryFee,
          total
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Get buyer's orders
export const getBuyerOrders = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { status, page = 1, limit = 20 } = req.query;

    // Get user ID
    let userId;
    
    if (uid.startsWith('dev-uid-')) {
      // Dev user - use the ID from the token
      userId = req.user.id;
    } else {
      // Real Firebase user - look up in database
      const [userRows] = await pool.query(
        "SELECT id FROM users WHERE firebase_uid = ?",
        [uid]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      userId = userRows[0].id;
    }
    let whereClause = "WHERE o.buyer_user_id = ?";
    let params = [userId];

    if (status) {
      whereClause += " AND o.status = ?";
      params.push(status);
    }

    const offset = (page - 1) * limit;

    // Get orders with farmer info
    const [orders] = await pool.query(
      `SELECT 
        o.*,
        farmer.full_name as farmer_name,
        farmer.phone as farmer_phone,
        farmer.region as farmer_region,
        farmer.woreda as farmer_woreda
      FROM orders o
      JOIN users farmer ON o.farmer_user_id = farmer.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Get order items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT 
          oi.*,
          pl.title as listing_title,
          NULL as image_url
        FROM order_items oi
        JOIN produce_listings pl ON oi.listing_id = pl.id
        WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Get farmer's orders
export const getFarmerOrders = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { status, page = 1, limit = 20 } = req.query;

    // Get user ID
    let userId;
    
    if (uid.startsWith('dev-uid-')) {
      // Dev user - use the ID from the token
      userId = req.user.id;
    } else {
      // Real Firebase user - look up in database
      const [userRows] = await pool.query(
        "SELECT id FROM users WHERE firebase_uid = ?",
        [uid]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      userId = userRows[0].id;
    }
    let whereClause = "WHERE o.farmer_user_id = ?";
    let params = [userId];

    if (status) {
      whereClause += " AND o.status = ?";
      params.push(status);
    }

    const offset = (page - 1) * limit;

    // Get orders with buyer info
    const [orders] = await pool.query(
      `SELECT 
        o.*,
        u.full_name as buyer_name,
        u.phone as buyer_phone,
        u.region as buyer_region,
        u.woreda as buyer_woreda,
        bp.company_name,
        bp.business_type
      FROM orders o
      JOIN users u ON o.buyer_user_id = u.id
      LEFT JOIN buyer_profiles bp ON u.id = bp.user_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Get order items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT 
          oi.*,
          pl.title as listing_title,
          NULL as image_url
        FROM order_items oi
        JOIN produce_listings pl ON oi.listing_id = pl.id
        WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    // Get user ID and role
    let userId, userRole;
    
    if (uid.startsWith('dev-uid-')) {
      // Dev user - use the ID and role from the token
      userId = req.user.id;
      userRole = req.user.role;
    } else {
      // Real Firebase user - look up in database
      const [userRows] = await pool.query(
        "SELECT id, role FROM users WHERE firebase_uid = ?",
        [uid]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      userId = userRows[0].id;
      userRole = userRows[0].role;
    }

    // Get order with user info
    const [orders] = await pool.query(
      `SELECT 
        o.*,
        buyer.full_name as buyer_name,
        buyer.phone as buyer_phone,
        buyer.region as buyer_region,
        buyer.woreda as buyer_woreda,
        farmer.full_name as farmer_name,
        farmer.phone as farmer_phone,
        farmer.region as farmer_region,
        farmer.woreda as farmer_woreda,
        bp.company_name,
        bp.business_type,
        fp.farm_name
      FROM orders o
      JOIN users buyer ON o.buyer_user_id = buyer.id
      JOIN users farmer ON o.farmer_user_id = farmer.id
      LEFT JOIN buyer_profiles bp ON buyer.id = bp.user_id
      LEFT JOIN farmer_profiles fp ON farmer.id = fp.user_id
      WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];

    // Verify user has access to this order
    if (userRole === 'buyer' && order.buyer_user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to view this order" });
    }

    if (userRole === 'farmer' && order.farmer_user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to view this order" });
    }

    // Get order items
    const [items] = await pool.query(
      `SELECT 
        oi.*,
        pl.title as listing_title,
        NULL as image_url
      FROM order_items oi
      JOIN produce_listings pl ON oi.listing_id = pl.id
      WHERE oi.order_id = ?`,
      [id]
    );

    order.items = items;

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get user ID and role
    let userId, userRole;
    
    if (uid.startsWith('dev-uid-')) {
      // Dev user - use the ID and role from the token
      userId = req.user.id;
      userRole = req.user.role;
    } else {
      // Real Firebase user - look up in database
      const [userRows] = await pool.query(
        "SELECT id, role FROM users WHERE firebase_uid = ?",
        [uid]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      userId = userRows[0].id;
      userRole = userRows[0].role;
    }

    // Get order
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];

    // Debug logging
    console.log('🔍 Authorization check:');
    console.log(`   - User ID: ${userId}, Role: ${userRole}`);
    console.log(`   - Order buyer: ${order.buyer_user_id}, Order farmer: ${order.farmer_user_id}`);
    console.log(`   - Requested status: ${status}`);

    // Verify user can update this order
    if (userRole === 'buyer' && order.buyer_user_id !== userId) {
      console.log('❌ Buyer authorization failed');
      return res.status(403).json({ error: "Not authorized to update this order" });
    }

    if (userRole === 'farmer' && order.farmer_user_id !== userId) {
      console.log('❌ Farmer authorization failed');
      return res.status(403).json({ error: "Not authorized to update this order" });
    }

    console.log('✅ Authorization passed');

    // Status transition rules
    if (userRole === 'buyer') {
      if (!['pending', 'cancelled'].includes(status)) {
        return res.status(403).json({ error: "Buyers can only cancel pending orders" });
      }
    }

    if (userRole === 'farmer') {
      if (['cancelled'].includes(status)) {
        return res.status(403).json({ error: "Farmers cannot cancel orders" });
      }
    }

    // Update order status
    await pool.query(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, id]
    );

    res.json({ message: "Order status updated successfully", status });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { period = 'month' } = req.query;

    // Get user ID and role
    let userId, userRole;
    
    if (uid.startsWith('dev-uid-')) {
      // Dev user - use the ID and role from the token
      userId = req.user.id;
      userRole = req.user.role;
    } else {
      // Real Firebase user - look up in database
      const [userRows] = await pool.query(
        "SELECT id, role FROM users WHERE firebase_uid = ?",
        [uid]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      userId = userRows[0].id;
      userRole = userRows[0].role;
    }

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (period === 'month') {
      dateFilter = "AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    } else if (period === 'year') {
      dateFilter = "AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    }

    let statsQuery = '';
    if (userRole === 'buyer') {
      statsQuery = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(o.total) as total_spent,
          COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders
        FROM orders o
        WHERE o.buyer_user_id = ? ${dateFilter}
      `;
    } else {
      statsQuery = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(o.total) as total_earnings,
          COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders
        FROM orders o
        WHERE o.farmer_user_id = ? ${dateFilter}
      `;
    }

    const [stats] = await pool.query(statsQuery, [userId]);

    res.json({ stats: stats[0] });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: "Failed to fetch order statistics" });
  }
};

