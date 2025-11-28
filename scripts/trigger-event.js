// scripts/trigger-event.js
// import fetch from "node-fetch"; // Or built-in in Node 18+

const API_URL = "http://localhost:3000";
const EMAIL = "ayush1234@gmail.com";
const PASSWORD = "ayush123@";

async function triggerEvent() {
    try {
        // 1. Login
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        });
        const { accessToken } = await loginResponse.json();

        if (!accessToken) throw new Error("Login failed");

        // 2. Create Task
        console.log("Creating a task to trigger event...");
        const taskResponse = await fetch(`${API_URL}/api/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                title: "Socket Test Task " + Date.now(),
                description: "Testing socket events11",
                status: "todo",
                priority: 2,
                dueDate: new Date().toISOString()
            })
        });

        if (taskResponse.ok) {
            console.log("✅ Task created successfully!");
        } else {
            console.error("❌ Failed to create task:", await taskResponse.text());
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

triggerEvent();
