# Socket.IO Testing Guidelines

This document outlines how to test the Socket.IO functionality in the Task Manager application.

## Prerequisites

1.  **Server Running**: Ensure your backend server is running (`npm run dev`).
2.  **Redis Running**: Ensure your Redis instance is running.
3.  **Valid User**: You need a registered user to authenticate.

---

## Method 1: Using the Helper Script (Recommended)

We have created a helper script to automate the connection test.

1.  **Install Dependencies** (if not already done):
    ```bash
    npm install -D socket.io-client
    ```

2.  **Edit the Script**:
    Open `scripts/test-socket-client.js` and update the `EMAIL` and `PASSWORD` constants with valid credentials from your database.

3.  **Run the Script**:
    ```bash
    node scripts/test-socket-client.js
    ```

    **Expected Output**:
    ```text
    1. Logging in to get token...
       Login successful! Token received.
    2. Connecting to Socket.IO server...
       ✅ Socket connected successfully!
       Socket ID: ...
    ```

---

## Method 2: Using Postman

You can use Postman to test WebSocket connections.

1.  **Get a JWT Token**:
    *   Make a `POST` request to `http://localhost:3000/auth/login`.
    *   Body (JSON): `{ "email": "...", "password": "..." }`
    *   Copy the `accessToken` from the response.

2.  **Open a Socket Request**:
    *   In Postman, click **New** > **Socket.IO**.
    *   Enter URL: `http://localhost:3000`.

3.  **Configure Authentication**:
    *   Go to the **Events** tab (or **Settings** depending on Postman version, but usually we pass auth in Handshake).
    *   **Crucial Step**: In the **Handshake** (or **Settings** > **Handshake Request**) section (if available) or simply use the **Events** tab to listen.
    *   **Correct Way**:
        *   Click on the **Connect** button to test the connection *without* auth first (it should fail/disconnect if auth is enforced).
        *   To pass the token:
            *   Go to the **Settings** tab (or **Handshake** tab if visible).
            *   Look for **Handshake Path** (leave default) or **Query Params**.
            *   **Postman Socket.IO Client Settings**:
                *   There is usually a specific **Auth** tab or you might need to send it as a custom handshake field.
                *   *Note*: As of recent Postman versions, finding the "Auth" payload for Socket.IO can be tricky.
                *   **Alternative**: Use the **Query** parameters if you modify the server to accept token in query, but our server uses `socket.handshake.auth.token`.

    *(Self-correction: The script method is much more reliable for `socket.handshake.auth` testing than Postman's current UI for specific auth payloads).*

---

## Step 3: Enabling Event Emission (Important)

Currently, the server **listens** for connections but does not **emit** any events when actions happen (like creating a task). To see real-time updates, you need to use the `io` instance in your controllers.

**How to add it:**

1.  Open `src/controllers/taskController.js` (or wherever you create tasks).
2.  Import `getIO`:
    ```javascript
    import { getIO } from '../services/socket.js';
    ```
3.  Emit an event after a successful action:
    ```javascript
    export const createTask = async (req, res) => {
        // ... existing logic ...
        const newTask = await Task.create(req.body);

        // EMIT EVENT
        const io = getIO();
        io.emit('task.created', newTask); // Broadcast to all connected clients

        res.status(201).json(newTask);
    };
    ```

Once this is added, running the test script while simultaneously creating a task (via Postman or another terminal) will show:
`📩 Received 'task.created' event: ...`
