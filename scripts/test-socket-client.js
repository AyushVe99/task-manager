import { io } from "socket.io-client";
// import fetch from "node-fetch"; // Built-in fetch is used in Node 18+

// CONFIGURATION
const API_URL = "http://localhost:3000";
const EMAIL = "ayush1234@gmail.com"; // CHANGE THIS to a valid user email
const PASSWORD = "ayush123@";   // CHANGE THIS to a valid user password

async function testSocket() {
    console.log("1. Logging in to get token...");

    try {
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        });

        if (!loginResponse.ok) {
            const error = await loginResponse.text();
            throw new Error(`Login failed: ${error}`);
        }

        const data = await loginResponse.json();
        const token = data.accessToken;
        console.log("   Login successful! Token received.");

        console.log("2. Connecting to Socket.IO server...");
        const socket = io(API_URL, {
            auth: {
                token: token,
            },
        });

        socket.on("connect", () => {
            console.log("   ✅ Socket connected successfully!");
            console.log(`   Socket ID: ${socket.id}`);
        });

        socket.on("connect_error", (err) => {
            console.error("   ❌ Connection Error:", err.message);
        });

        socket.on("disconnect", () => {
            console.log("   Socket disconnected");
        });

        // Listen for events (Add your custom events here)
        socket.on("task.created", (data) => {
            console.log("   📩 Received 'task.created' event:", data);
        });

        // Keep the script running for a bit to receive events
        setTimeout(() => {
            console.log("3. Closing connection after 10 seconds...");
            socket.disconnect();
        }, 30000);

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testSocket();
