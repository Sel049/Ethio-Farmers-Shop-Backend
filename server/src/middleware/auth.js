import admin from "../config/firebase.js";

export const authGuard = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    // Development token handling takes precedence even if Firebase isn't configured
    // Accept a simple dev token: dev-token-{user_id}-{role?}-{...}
    if (token === 'dev-token-123' || token.startsWith('dev-token-')) {
      console.warn("Development token accepted (pre-Firebase check)");
      const tokenParts = token.split('-');
      const userId = parseInt(tokenParts[2], 10);
      let role = 'buyer';
      if (tokenParts.length >= 4 && ['buyer', 'farmer'].includes(tokenParts[3])) {
        role = tokenParts[3];
      }
      req.user = {
        uid: isNaN(userId) ? 'dev-user-id' : `dev-uid-${userId}`,
        id: isNaN(userId) ? undefined : userId,
        email: 'dev@example.com',
        role
      };
      return next();
    }

    // Check if Firebase is properly configured
    if (!admin.apps.length) {
      console.warn("Firebase not properly configured, skipping token verification");
      // Fallback generic dev user
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
        
        // Extract user ID from dev token format: dev-token-{user_id}-{role}-{timestamp}
        // or dev-token-{user_id} (defaults to buyer role)
        const tokenParts = token.split('-');
        const userId = tokenParts[2]; // Get the user ID part
        
        // Check if role is specified in token (4th part)
        let role = 'buyer'; // Default role
        if (tokenParts.length >= 4 && ['buyer', 'farmer'].includes(tokenParts[3])) {
          role = tokenParts[3];
        }
        
        // Create a proper user object that controllers can use
        req.user = {
          uid: `dev-uid-${userId}`, // Mock Firebase UID
          id: parseInt(userId), // MySQL user ID
          email: 'dev@example.com',
          role: role
        };
        return next();
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
