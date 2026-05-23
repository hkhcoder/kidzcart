-- KidzCart — MySQL schema + seed for Java `services/marketplace-service`
-- Creates: kids_marketplace_auth (users + profile coupons) and kids_marketplace_order (orders + order coupons).
--
-- Run: mysql -u <user> -p < db/kids_marketplace_mysql_init.sql

-- =============================================================================
-- 0) Grant the 'admin' user access to both databases
--    (MYSQL_USER creates the user but grants no DB-level permissions)
-- =============================================================================
GRANT ALL PRIVILEGES ON kids_marketplace_auth.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON kids_marketplace_order.* TO 'admin'@'%';
FLUSH PRIVILEGES;

-- =============================================================================
-- 1) Auth database
-- =============================================================================

CREATE DATABASE IF NOT EXISTS kids_marketplace_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kids_marketplace_auth;

CREATE TABLE IF NOT EXISTS users (
  id           VARCHAR(32)  NOT NULL,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY ux_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS coupons (
  code        VARCHAR(64) NOT NULL,
  user_id     VARCHAR(32) NOT NULL,
  discount    INT          NOT NULL,
  used        TINYINT(1)  NOT NULL DEFAULT 0,
  created_at  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at  TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (code),
  KEY idx_coupons_user_id (user_id),
  CONSTRAINT fk_coupons_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO users (id, name, email, password_hash, created_at) VALUES
  ('u1', 'Amina Kids', 'amina@example.com', 'password', NOW(6)),
  ('u2', 'Ben Helper',  'ben@example.com',   'password', NOW(6))
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  password_hash = VALUES(password_hash);

INSERT INTO coupons (code, user_id, discount, used, created_at, expires_at) VALUES
  ('DONATE-DEMO-ABC123', 'u1', 10, 0, NOW(6), DATE_ADD(NOW(6), INTERVAL 30 DAY)),
  ('DONATE-DEMO-XYZ789', 'u2', 10, 0, NOW(6), DATE_ADD(NOW(6), INTERVAL 30 DAY))
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  discount = VALUES(discount),
  used = VALUES(used),
  expires_at = VALUES(expires_at);

-- =============================================================================
-- 2) Order database
-- =============================================================================

CREATE DATABASE IF NOT EXISTS kids_marketplace_order
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kids_marketplace_order;

CREATE TABLE IF NOT EXISTS coupons (
  code        VARCHAR(64)  NOT NULL,
  user_id     VARCHAR(32)  NOT NULL,
  discount    INT           NOT NULL,
  used        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at  TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (code),
  KEY idx_coupons_user_id (user_id),
  KEY idx_coupons_user_code (user_id, code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id               BIGINT AUTO_INCREMENT NOT NULL,
  user_id         VARCHAR(32) NOT NULL,
  items_json      LONGTEXT NOT NULL,
  subtotal        INT NOT NULL,
  discount_applied INT NOT NULL,
  total           INT NOT NULL,
  coupon_code     VARCHAR(64) NULL,
  payment_status  VARCHAR(32) NOT NULL,
  created_at      TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_orders_user_id_created_at (user_id, created_at)
) ENGINE=InnoDB;

INSERT INTO coupons (code, user_id, discount, used, created_at, expires_at) VALUES
  ('DONATE-DEMO-ABC123', 'u1', 10, 0, NOW(6), DATE_ADD(NOW(6), INTERVAL 30 DAY)),
  ('DONATE-DEMO-USED000', 'u1', 10, 1, NOW(6), DATE_ADD(NOW(6), INTERVAL 10 DAY)),
  ('DONATE-DEMO-EXPIRED', 'u2', 10, 0, NOW(6), DATE_SUB(NOW(6), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  discount = VALUES(discount),
  used = VALUES(used),
  expires_at = VALUES(expires_at);

INSERT INTO orders (user_id, items_json, subtotal, discount_applied, total, coupon_code, payment_status, created_at) VALUES
  (
    'u1',
    '[{"productId":"p1","name":"Kids Book - ABC","price":100,"qty":2}]',
    200,
    20,
    180,
    'DONATE-DEMO-ABC123',
    'PAID_MOCK',
    NOW(6)
  )
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id);
