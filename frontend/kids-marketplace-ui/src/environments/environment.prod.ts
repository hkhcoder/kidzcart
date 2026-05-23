export const environment = {
  production: true,
  /**
   * Use a relative `/api` path so the browser calls the same host it loaded
   * from. Nginx (or any reverse proxy) on the frontend server handles routing
   * `/api/*` to the correct backend service.
   * This works for any deployment — Vagrant, EC2, or local — without changes.
   */
  apiBaseUrl: '/api',
};
