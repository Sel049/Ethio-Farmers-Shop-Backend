# 🚀 Ethio Farmers Shop - Backend Setup Guide

## 📋 Overview

This backend provides a complete REST API for the Ethiopian Farmers Marketplace, including:

- **User Authentication** (Firebase integration)
- **Produce Listings Management**
- **Order Processing System**
- **Market Trends & Analytics**
- **User Reviews & Ratings**
- **Favorites & Bookmarks**
- **Search & Filtering**
- **Dashboard & Analytics**
- **Notifications System**

## 🛠️ Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Firebase Admin SDK credentials

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the server directory with:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=ethio_farmers_db
   DB_PORT=3306
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your_client_id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
   ```

3. **Set up database:**
   ```bash
   # Run the schema file
   mysql -u your_user -p your_database < src/sql/schema.sql
   ```

## 🚀 Running the Server

1. **Development mode:**
   ```bash
   npm run dev
   ```

2. **Production mode:**
   ```bash
   npm start
   ```

3. **Check server health:**
   ```bash
   curl http://localhost:5000/health
   ```

## 📚 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify Firebase token

### 👥 Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/farmer-profile` - Get farmer profile
- `PUT /api/users/farmer-profile` - Update farmer profile

### 🥬 Listings
- `GET /api/listings` - Get all listings
- `GET /api/listings/:id` - Get specific listing
- `POST /api/listings` - Create new listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `GET /api/farmer/listings` - Get farmer's listings
- `GET /api/listings/search` - Search listings

### 📦 Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get specific order
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/buyer/orders` - Get buyer's orders
- `GET /api/farmer/orders` - Get farmer's orders
- `GET /api/orders/stats` - Get order statistics

### 📊 Market Trends
- `GET /api/market/trends` - Get price trends
- `GET /api/market/overview` - Get market overview
- `GET /api/market/seasonal-insights` - Get seasonal insights
- `GET /api/market/comparison` - Compare markets
- `GET /api/market/popular-produce` - Get popular produce

### ❤️ Favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:listingId` - Remove from favorites
- `GET /api/favorites/listings` - Get favorite listings
- `GET /api/favorites/farmers` - Get favorite farmers
- `GET /api/favorites/check/:listingId` - Check favorite status
- `GET /api/favorites/stats` - Get favorite statistics

### 🔔 Notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/stats` - Get notification statistics

### 🔍 Search
- `GET /api/search/listings` - Search listings
- `GET /api/search/farmers` - Search farmers
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/search/popular` - Get popular searches
- `GET /api/search/analytics` - Get search analytics

### ⭐ Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/listing/:listingId` - Get listing reviews
- `GET /api/reviews/farmer/:farmerId` - Get farmer reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/user` - Get user's reviews
- `GET /api/reviews/stats` - Get review statistics

Details:
- Public: `GET /api/reviews/listing/:listingId`, `GET /api/reviews/farmer/:farmerId`
- Auth required: `POST /api/reviews`, `PUT /api/reviews/:id`, `DELETE /api/reviews/:id`, `GET /api/reviews/user`, `GET /api/reviews/stats`
- Create review body:
```json
{
  "listingId": 2,
  "rating": 5,
  "comment": "Great quality and fresh!"
}
```
Constraints:
- Only buyers can create reviews.
- Buyer must have a COMPLETED order containing the listing.
- One review per buyer per listing.

Responses include reviewer and listing context. Aggregated stats (averages, distributions) are computed from the `reviews` table dynamically.

### 📈 Dashboard
- `GET /api/dashboard/buyer` - Buyer dashboard
- `GET /api/dashboard/farmer` - Farmer dashboard
- `GET /api/dashboard/admin` - Admin dashboard
- `GET /api/dashboard/analytics` - Analytics data

## 🔒 Authentication

All protected endpoints require an Authorization header. You can use either:

- Firebase ID token (production):
```
Authorization: Bearer <firebase_id_token>
```

- Development token (local/testing):
```
Authorization: Bearer dev-token-<userId>-<role>
```
Examples: `dev-token-7-buyer`, `dev-token-201-farmer`

Notes:
- With dev tokens, controllers set `req.user.uid = dev-uid-<userId>` and use `req.user.id = <userId>` directly.
- Most controllers handle dev tokens without requiring a matching `users.firebase_uid` row, but the underlying features still expect valid related data (e.g., orders, listings).

## 🗄️ Database Schema

The database includes tables for:
- Users (farmers & buyers)
- Produce listings
- Orders & order items
- Reviews & ratings
- Favorites
- Notifications
- Price trends
- User profiles

Notes specific to reviews:
- `reviews` uses `reviewer_user_id` (not `user_id`).
- No `avg_rating` or `review_count` columns exist on `produce_listings` or `users`; averages are computed on read.

## 🧪 Testing

1. **Test health endpoint:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Test authentication:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

## 🚨 Error Handling

The API returns consistent error responses:
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

## 📊 Monitoring

- Health check endpoint: `/health`
- Server logs include request/response details
- Error logging with stack traces in development

## 🔧 Configuration

Key configuration options in `.env`:
- Database connection settings
- Firebase credentials
- Server port and environment
- CORS settings
- Rate limiting

## 🚀 Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up proper Firebase credentials
4. Use PM2 or similar process manager
5. Set up reverse proxy (Nginx)
6. Configure SSL certificates

## 📝 Notes

- All timestamps are in UTC
- Currency is Ethiopian Birr (ETB) by default
- Images are stored as URLs (external storage recommended)
- Firebase handles user authentication
- Database uses MySQL with proper indexing

