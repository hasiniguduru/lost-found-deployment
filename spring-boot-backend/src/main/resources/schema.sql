-- ============================================================================
-- VERITAS CAMPUS LOST & FOUND — MYSQL 8.0 RELATIONAL DATABASE SCHEMA
-- Supports Roles: OWNER, FINDER, ADMIN_SECURITY
-- ============================================================================

CREATE DATABASE IF NOT EXISTS campus_lost_found_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_lost_found_db;

-- 1. USERS TABLE (Role-Based Access & Campus Identity Verification)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    campus_id VARCHAR(32) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role ENUM('OWNER', 'FINDER', 'ADMIN_SECURITY') NOT NULL DEFAULT 'OWNER',
    verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_campus_id (campus_id)
) ENGINE=InnoDB;

-- 2. FIXED COLLECTION HUBS (Physical Campus Security Custody & Submission Desks)
CREATE TABLE IF NOT EXISTS collection_hubs (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(24) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    building VARCHAR(120) NOT NULL,
    room_location VARCHAR(120) NOT NULL,
    operating_hours VARCHAR(100) NOT NULL,
    duty_officer VARCHAR(100) NOT NULL,
    contact_ext VARCHAR(32) NOT NULL,
    total_bins INT NOT NULL DEFAULT 24,
    occupied_bins INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- 3. LOST & FOUND ITEM REPORTS
CREATE TABLE IF NOT EXISTS item_reports (
    id VARCHAR(36) PRIMARY KEY,
    reference_code VARCHAR(24) NOT NULL UNIQUE,
    title VARCHAR(140) NOT NULL,
    type ENUM('LOST', 'FOUND') NOT NULL,
    category ENUM('Electronics', 'Campus ID & Keys', 'Textbooks & Lab Gear', 'Apparel & Bags', 'Personal Accessories') NOT NULL,
    campus_zone VARCHAR(100) NOT NULL,
    specific_location VARCHAR(160) NOT NULL,
    date_occurred VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    distinguishing_features VARCHAR(255),
    verification_question VARCHAR(255) NOT NULL,
    expected_verification_hint VARCHAR(255),
    custody_status ENUM('REPORTED', 'AWAITING_SUBMISSION', 'IN_CUSTODY', 'CLAIM_APPROVED', 'RETURNED') NOT NULL,
    hub_id VARCHAR(36),
    hub_name VARCHAR(120),
    locker_bin VARCHAR(32),
    submission_receipt_code VARCHAR(32),
    image_url LONGTEXT,
    reported_by_user_id VARCHAR(36) NOT NULL,
    reported_by_name VARCHAR(100) NOT NULL,
    reported_by_campus_id VARCHAR(32) NOT NULL,
    reported_by_role ENUM('OWNER', 'FINDER', 'ADMIN_SECURITY') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_hub FOREIGN KEY (hub_id) REFERENCES collection_hubs(id) ON DELETE SET NULL,
    CONSTRAINT fk_item_reporter FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_items_type_status (type, custody_status),
    INDEX idx_items_category (category),
    INDEX idx_items_zone (campus_zone)
) ENGINE=InnoDB;

-- 4. OWNERSHIP VERIFICATION CLAIMS & FIXED PICKUP PASSES
CREATE TABLE IF NOT EXISTS ownership_claims (
    id VARCHAR(36) PRIMARY KEY,
    claim_code VARCHAR(24) NOT NULL UNIQUE,
    item_id VARCHAR(36) NOT NULL,
    item_reference_code VARCHAR(24) NOT NULL,
    item_title VARCHAR(140) NOT NULL,
    item_type ENUM('LOST', 'FOUND') DEFAULT 'FOUND',
    claimant_user_id VARCHAR(36) NOT NULL,
    claimant_name VARCHAR(100) NOT NULL,
    claimant_email VARCHAR(120) NOT NULL,
    claimant_campus_id VARCHAR(32) NOT NULL,
    verification_answer TEXT NOT NULL,
    proof_description TEXT NOT NULL,
    serial_or_id_number VARCHAR(100),
    status ENUM('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'HANDED_OVER') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    reviewed_by_officer VARCHAR(100),
    officer_remarks TEXT,
    pickup_pass_code VARCHAR(32),
    collection_hub_name VARCHAR(120),
    locker_bin VARCHAR(32),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    handed_over_at TIMESTAMP NULL,
    CONSTRAINT fk_claim_item FOREIGN KEY (item_id) REFERENCES item_reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_claim_user FOREIGN KEY (claimant_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_claims_status (status),
    INDEX idx_claims_item (item_id)
) ENGINE=InnoDB;

-- 5. SYSTEM & CUSTODY NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_user_id VARCHAR(36) NOT NULL,
    recipient_role ENUM('OWNER', 'FINDER', 'ADMIN_SECURITY', 'ALL') NOT NULL DEFAULT 'ALL',
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    category ENUM('MATCH_ALERT', 'CUSTODY_INTAKE', 'VERIFICATION_UPDATE', 'PICKUP_READY') NOT NULL,
    related_item_id VARCHAR(36),
    action_code VARCHAR(32),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_recipient (recipient_user_id, is_read)
) ENGINE=InnoDB;
