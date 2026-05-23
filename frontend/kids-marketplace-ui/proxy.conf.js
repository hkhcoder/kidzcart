/**
 * Dev-server proxy: `/api/*` → backends (strip `/api` so Express sees `/products`, `/auth`, …).
 * Node marketplace API (:4002) must be matched explicitly — array `context` lists can miss paths in some setups.
 */
function isNodeMarketplaceApi(pathname) {
  return (
    pathname.startsWith('/api/products') ||
    pathname.startsWith('/api/donations') ||
    pathname.startsWith('/api/notifications') ||
    pathname.startsWith('/api/health')
  );
}

module.exports = [
  {
    context: isNodeMarketplaceApi,
    target: 'http://127.0.0.1:4002',
    secure: false,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    logLevel: 'silent',
  },
  {
    context: ['/api/auth', '/api/users', '/api/orders', '/api/coupon'],
    target: 'http://127.0.0.1:4001',
    secure: false,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    logLevel: 'silent',
  },
  {
    context: ['/api/achievements'],
    target: 'http://127.0.0.1:4006',
    secure: false,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    logLevel: 'silent',
  },
];
