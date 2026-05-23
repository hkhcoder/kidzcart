export const environment = {
  production: false,
  /**
   * `/api` keeps backend calls off Angular routes (`/products`, `/auth`, …).
   * `proxy.conf.js` strips `/api` and forwards to :4001 (Java marketplace: auth+orders+coupon), :4006 (achievements), :4002 (products/donations).
   */
  apiBaseUrl: '/api',
};
