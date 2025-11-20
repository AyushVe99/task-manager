module.exports = {
    apps: [{
        name: "task-manager",
        script: "./src/index.js",
        instances: "max",
        exec_mode: "cluster",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
}
