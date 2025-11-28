import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createAdapter } from "@socket.io/redis-adapter";
import redisClient from "../config/redis.js";

let io;

/**
 * Initialize Socket.IO server with Redis adapter and authentication
 * @param {Object} server - The HTTP server instance
 */
export const initializeSocket = (server) => {
    // Create Socket.IO instance with CORS enabled
    io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins (configure this for production)
        },
    });

    // Configure Redis Adapter for scaling across multiple nodes
    // We need two clients: one for publishing and one for subscribing
    const pubClient = redisClient;
    const subClient = redisClient.duplicate();

    Promise.all([subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO Redis Adapter configured");
    });

    // Authentication Middleware
    // Verifies the JWT token sent in the handshake
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        console.log("token", token);

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return next(new Error("Authentication error: Invalid token"));
            }
            // Attach user info to the socket instance
            socket.user = user;
            next();
        });
    });

    // Connection Handler
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user.userId}`);

        // Join the user to a private room named after their User ID
        // This allows sending events specifically to this user
        socket.join(socket.user.userId);
    });
};

/**
 * Get the initialized Socket.IO instance
 * @returns {Server} The Socket.IO server instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized!");
    }
    return io;
};
