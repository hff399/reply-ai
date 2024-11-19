module.exports = {
    apps: [
      {
        name: "backend", // Name of your application
        script: "./dist/server.js", // Path to the entry point of your app
        env: {
          NODE_ENV: "production", // Environment variables for production
          PORT: 3001, // Port your app runs on
        },
      },
    ],
  };
  