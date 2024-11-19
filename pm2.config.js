module.exports = {
    apps: [
      // Frontend Application
      {
        name: "frontend", // Name of the frontend app in PM2
        script: "npm", // Run npm as the script
        args: "start", // Start the app using `npm start`
        cwd: "./frontend", // Path to the frontend directory
        exec_mode: "fork", // Single instance (no clustering)
        instances: 1, // Single instance
        env: {
          NODE_ENV: "production",
          PORT: 3000, // Port for frontend app
        },
        log_file: "./logs/frontend.log", // Log file location
        error_file: "./logs/frontend_error.log", // Error log file location
        out_file: "./logs/frontend_output.log", // Standard output log file
      },
      // Backend Application
      {
        name: "backend", // Name of the backend app in PM2
        script: "npm", // Run npm as the script
        args: "start", // Start the backend using `npm start`
        cwd: "./backend", // Path to the backend directory
        exec_mode: "fork", // Single instance (no clustering)
        instances: 1, // Single instance
        env: {
          NODE_ENV: "production",
          PORT: 3001, // Port for backend app
        },
        log_file: "./logs/backend.log", // Log file location
        error_file: "./logs/backend_error.log", // Error log file location
        out_file: "./logs/backend_output.log", // Standard output log file
      },
    ],
  };
  