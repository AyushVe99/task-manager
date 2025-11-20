# Task Manager API

Welcome to the **Task Manager API**! 🚀

This is a backend application that helps you manage tasks. You can create accounts, log in, and manage your to-do list. It's built to be fast, secure, and scalable.

---

## 🛠️ Tech Stack
(The tools we used to build this)
*   **Node.js & Express**: The brain of the application.
*   **MongoDB**: Where we store users and tasks (Database).
*   **Redis**: Used for fast, secure authentication (Token management).
*   **PM2**: Keeps the app running smoothly in production.

---

## ✨ Features
*   **Secure Login**: Uses JWT (JSON Web Tokens) and Redis to keep accounts safe.
*   **Task Management**: Create, Read, Update, and Delete tasks.
*   **Admin Power**: Admins can edit any task.
*   **Scalable**: Ready for high traffic with Rate Limiting and Clustering.

---

## 🚀 How to Run (For Beginners)

### 1. Prerequisites
Make sure you have these installed on your computer:
*   [Node.js](https://nodejs.org/)
*   [MongoDB](https://www.mongodb.com/try/download/community) (or use a cloud URL)
*   [Redis](https://redis.io/download/)

### 2. Setup
1.  **Clone the code**:
    ```bash
    git clone https://github.com/Ayush30012000/task-manager.git
    cd task-manager
    ```

2.  **Install libraries**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a file named `.env` in the root folder and add this:
    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/task-manager
    JWT_SECRET=supersecretkey
    # Redis Configuration (Default is localhost:6379)
    ```

### 3. Start the App
*   **For Development** (Updates automatically when you save):
    ```bash
    npm run dev
    ```
*   **For Production** (Fast and stable):
    ```bash
    npm start
    ```

The server will start at: `http://localhost:3000`

---

## 🔌 API Endpoints (How to use it)

### Authentication
*   `POST /auth/register`: Create a new account.
*   `POST /auth/login`: Log in to get access.
*   `POST /auth/logout`: Log out.

### Tasks
*   `GET /api/tasks`: Get all your tasks.
*   `POST /api/tasks`: Create a new task.
*   `PUT /api/tasks/:id`: Update a task (Admins can update any).
*   `DELETE /api/tasks/:id`: Delete a task.

---

## 📂 Project Structure
*   `src/index.js`: The entry point (starts the server).
*   `src/routes`: Defines the URL paths (like /login, /tasks).
*   `src/models`: Defines how data looks (User, Task).
*   `src/services`: The logic behind the scenes.
*   `src/middleware`: Security checks (like checking if you are logged in).

---

**Happy Coding!** 🎉