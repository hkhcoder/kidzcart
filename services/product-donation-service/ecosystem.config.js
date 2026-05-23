module.exports = {
  apps: [
    {
      name: 'product-server',
      script: 'src/server.js',
      cwd: '/opt/kidzcart/services/product-donation-service',
      env_file: '/opt/kidzcart/services/product-donation-service/.env',
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'coupon-worker',
      script: 'src/workers/couponWorker.js',
      cwd: '/opt/kidzcart/services/product-donation-service',
      env_file: '/opt/kidzcart/services/product-donation-service/.env',
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'notification-worker',
      script: 'src/workers/notificationWorker.js',
      cwd: '/opt/kidzcart/services/product-donation-service',
      env_file: '/opt/kidzcart/services/product-donation-service/.env',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
