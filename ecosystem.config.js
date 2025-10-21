require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'snapp-food-scraper',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        TZ: 'Asia/Tehran' // Ensure timezone is set correctly
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Ensure scheduler starts after app is ready
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ]
};

