import admin from "../config/firebase.js";

export const authGuard = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    // Check if Firebase is properly configured
    if (!admin.apps.length) {
      console.warn("Firebase not properly configured, skipping token verification");
      // For development, create a mock user
      req.user = {
        uid: 'dev-user-id',
        email: 'dev@example.com',
        role: 'farmer'
      };
      return next();
    }

    try {
      // Try to verify as Firebase ID token first
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      return next();
    } catch (firebaseError) {
      console.warn("Firebase ID token verification failed:", firebaseError.message);
      
      // For development, check if it's a custom token format
      if (token.startsWith('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9')) {
        try {
          // This is a custom token, we need to exchange it for an ID token
          // For now, let's create a mock user for development
          console.warn("Custom token detected - in production, client should exchange this for ID token");
          req.user = {
            uid: 'dev-user-from-custom-token',
            email: 'dev@example.com',
            role: 'farmer'
          };
          return next();
        } catch (customTokenError) {
          console.error("Custom token handling error:", customTokenError);
        }
      }
      
      // For development, accept a simple dev token
      if (token === 'dev-token-123' || token.startsWith('dev-token-')) {
        console.warn("Development token accepted");
        
        // Extract user ID from dev token format: dev-token-{user_id}-{timestamp}
        const tokenParts = token.split('-');
        const userId = tokenParts[2]; // Get the user ID part
        
        // Look up the actual user role from database
        try {
          const mysql = await import('mysql2/promise');
          const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          });
          
          const [users] = await pool.query(
            "SELECT id, role, email, full_name FROM users WHERE id = ?",
            [userId]
          );
          
          if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
          }
          
          const user = users[0];
          
          // Create a proper user object that controllers can use
          req.user = {
            uid: `dev-uid-${userId}`, // Mock Firebase UID
            id: parseInt(userId), // MySQL user ID
            email: user.email,
            role: user.role // Use actual role from database
          };
          
          await pool.end();
          return next();
        } catch (dbError) {
          console.error("Database error in dev token auth:", dbError);
          return res.status(500).json({ error: "Authentication error" });
        }
      }
      
      return res.status(401).json({ 
        error: "Invalid token",
        message: "Token verification failed. Please ensure you're using a valid Firebase ID token.",
        hint: "After login, the client should sign in with the custom token to get an ID token"
      });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication error" });
  }
};

// Alias for compatibility with existing route files
export const authenticateToken = authGuard;
