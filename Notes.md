# 📚 Codebase Notes & Interview Guide

This document explains the core concepts used in this **Task Manager API** and provides common interview questions related to them.

---

## 1. 🏗️ Architecture: Layered (MVC-ish)
The project follows a **Layered Architecture** to separate concerns. This makes the code cleaner, easier to test, and scalable.

*   **Routes (`src/routes`)**: The entry point. It defines URLs (endpoints) and maps them to controllers/logic. It handles *HTTP* concerns (req/res).
*   **Middleware (`src/middleware`)**: Functions that run *before* the route handler. Used for Authentication (`auth.js`), Rate Limiting (`rateLimiter.js`), and Error Handling.
*   **Services (`src/services`)**: Contains the **Business Logic**. This is where the actual work happens (e.g., "Register User", "Calculate Score"). It interacts with the Database.
*   **Models (`src/models`)**: Defines the **Data Structure** (Schema) for MongoDB.
*   **Utils (`src/utils`)**: Helper functions (e.g., Logger, Token Manager).

### 🙋‍♂️ Interview Questions
*   **Q: Why use a layered architecture?**
    *   **A:** It separates concerns. If I want to change the database, I only touch the Model/Service layer, not the Routes. It makes the code modular and testable.
*   **Q: What is the difference between `app.use` and a specific route like `app.get`?**
    *   **A:** `app.use` applies middleware to *all* (or a group of) routes. `app.get` applies only to GET requests for a specific path.

---

## 2. 🔐 Authentication & Security
We use a robust **Stateless Authentication** system using **JWT (JSON Web Tokens)** and **Redis**.

### Key Concepts
1.  **JWT (JSON Web Token)**: A secure way to transmit information. We use it to identify the user.
    *   **Access Token**: Short-lived (e.g., 15 mins). Used to access API routes.
    *   **Refresh Token**: Long-lived (e.g., 7 days). Used to get a new Access Token when the old one expires.
2.  **Redis**: An in-memory data store. We use it for:
    *   **Storing Refresh Tokens**: To verify they are valid.
    *   **Blacklisting**: When a user logs out, we save their Access Token in Redis (blacklist) so it can't be used again until it expires.
3.  **Bcrypt**: Used to **Hash** passwords. We never store plain-text passwords. Hashing is one-way (cannot be decrypted).

### 🙋‍♂️ Interview Questions
*   **Q: Why use Access and Refresh tokens? Why not just one long-lived token?**
    *   **A:** Security. If an Access Token is stolen, it expires quickly (limiting damage). The Refresh Token can be revoked (deleted from Redis) to stop the attacker from getting new Access Tokens.
*   **Q: How do you handle Logout with JWT?**
    *   **A:** Since JWTs are stateless, we can't "delete" them from the client effectively. We use a **Blacklist** (in Redis) to store the token ID until it expires. Our middleware checks this blacklist.
*   **Q: Why Redis?**
    *   **A:** It's extremely fast (in-memory). Perfect for checking tokens on every request without hitting the main database (MongoDB).

---

## 3. 🗄️ Database (MongoDB & Mongoose)
We use **MongoDB** (NoSQL) with **Mongoose** (ODM - Object Data Modeling).

### Key Concepts
*   **Schema**: Defined in `src/models`. Enforces structure (e.g., `email` must be unique, `priority` must be a number).
*   **Indexing**: We added a **Compound Index** `{ owner: 1, status: 1 }` to the Task model.
    *   **Why?** It speeds up the most common query: "Find tasks for *User X* with *Status Y*".
*   **Relationships**: We link Tasks to Users using `ObjectId` (`ref: 'User'`).

### 🙋‍♂️ Interview Questions
*   **Q: SQL vs NoSQL? Why MongoDB?**
    *   **A:** MongoDB is flexible (schema-less by default, though we use Mongoose schemas) and scales well horizontally. It stores data in JSON-like documents, which maps perfectly to JavaScript objects in our Node.js app.
*   **Q: What is an Index? Does it have downsides?**
    *   **A:** An index is a data structure that makes searching faster (like a book index). **Downside:** It makes *Writes* (Insert/Update) slower because the index must also be updated.

---

## 4. 🚀 Scalability & Performance
We implemented several features to make the app "Production Ready".

### Key Concepts
1.  **Clustering**: Node.js is single-threaded. We use **PM2** (Process Manager) in `cluster` mode to launch multiple instances of the app (one per CPU core). They share the same port.
2.  **Rate Limiting**: We use `express-rate-limit` to restrict how many requests a user can make in a given time (e.g., 100 reqs / 15 mins). Prevents DDoS attacks and abuse.
3.  **Connection Pooling**: In `src/config/db.js`, we set `maxPoolSize: 10`. This maintains a pool of open connections to MongoDB so we don't have to handshake for every single request.

### 🙋‍♂️ Interview Questions
*   **Q: How does Node.js handle concurrency if it's single-threaded?**
    *   **A:** It uses the **Event Loop** and **Non-blocking I/O**. It delegates heavy tasks (like DB queries or File I/O) to the system kernel or worker threads and continues processing other requests.
*   **Q: What is the purpose of `maxPoolSize`?**
    *   **A:** Opening a DB connection is expensive (time-consuming). Pooling keeps connections open and reuses them, significantly speeding up response times.

---

## 5. 📝 Code Specifics (The "Admin" Logic)
We optimized the "Update Task" route to reduce Database calls.

*   **Old Way**: 1. Find Task -> 2. Find User (check role) -> 3. Update Task. (3 DB Calls)
*   **New Way**:
    1.  Embed `role` in the JWT token upon login.
    2.  In the route, check `req.user.role`.
    3.  If Admin: `findByIdAndUpdate`.
    4.  If User: `findOneAndUpdate({ _id: id, owner: userId })`.
    *   **Result**: Only **1 DB Call**.

### 🙋‍♂️ Interview Questions
*   **Q: How did you optimize the Update Route?**
    *   **A:** I moved the authorization check logic to rely on the JWT payload (which contains the role) instead of querying the User table again. I also used specific MongoDB queries (`findOneAndUpdate`) to enforce ownership atomically.

---

**Good luck with your interview! You got this!** 🚀
