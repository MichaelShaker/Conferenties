SET FOREIGN_KEY_CHECKS = 0;

-- =====================
-- CHURCHES
-- =====================
CREATE TABLE IF NOT EXISTS churches (
                                        id INT NOT NULL AUTO_INCREMENT,
                                        name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nederland',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
    ) ENGINE=InnoDB;

-- Seed (safe insert)
INSERT INTO churches (id, name, city, country)
VALUES (1, 'Coptic Orthodox Diocese of the Netherlands', 'Amsterdam', 'Nederland')
    ON DUPLICATE KEY UPDATE name = name;


-- =====================
-- USERS
-- =====================
CREATE TABLE IF NOT EXISTS users (
                                     id INT NOT NULL AUTO_INCREMENT,
                                     name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified TINYINT(1) DEFAULT 0,
    newsletter_enabled TINYINT(1) DEFAULT 1,
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
    ) ENGINE=InnoDB;


-- =====================
-- USER PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS user_profiles (
                                             id INT NOT NULL AUTO_INCREMENT,
                                             user_id INT NOT NULL,
                                             first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30),
    birth_date DATE,
    church_id INT,
    city VARCHAR(100),
    rank_title VARCHAR(100),
    confession_father VARCHAR(150),
    allergies TEXT,
    dietary_notes TEXT,
    shirt_size VARCHAR(20),
    transport_option VARCHAR(50),
    profile_completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_profile (user_id),
    KEY fk_profile_church (church_id),
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_profile_church FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;


-- =====================
-- CONFERENCES
-- =====================
CREATE TABLE IF NOT EXISTS conferences (
                                           id INT NOT NULL AUTO_INCREMENT,
                                           title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    conference_date DATE NOT NULL,
    description TEXT,
    image_url LONGTEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    max_event_days INT DEFAULT 1,
    allow_partial_days TINYINT(1) DEFAULT 0,
    price_1_day DECIMAL(10,2) NULL,
    price_2_days DECIMAL(10,2) NULL,
    price_3_days DECIMAL(10,2) NULL,
    capacity INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50) DEFAULT 'national',
    city VARCHAR(100),
    church_id INT,
    min_age INT,
    max_age INT,
    requires_church TINYINT(1) DEFAULT 0,
    requires_rank TINYINT(1) DEFAULT 0,
    requires_confession_father TINYINT(1) DEFAULT 0,
    requires_allergies TINYINT(1) DEFAULT 0,
    target_church_id INT,
    target_city VARCHAR(100),
    target_rank VARCHAR(100),
    payment_link VARCHAR(500),
    payment_qr_url LONGTEXT,
    payment_link_1_day VARCHAR(500),
    payment_link_2_days VARCHAR(500),
    payment_link_3_days VARCHAR(500),
    payment_qr_url_1_day LONGTEXT,
    payment_qr_url_2_days LONGTEXT,
    payment_qr_url_3_days LONGTEXT,
    payment_contact_name VARCHAR(150),
    payment_contact_phone VARCHAR(50),
    payment_instructions TEXT,
    google_sheet_id VARCHAR(255),
    google_sheet_url VARCHAR(500),
    google_sheet_last_synced_at TIMESTAMP NULL,
    google_sheet_last_error TEXT,
    registration_deadline DATE NULL,
    email_subject VARCHAR(255),
    email_body TEXT,
    archived_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    KEY fk_conference_church (church_id),
    KEY fk_conference_target_church (target_church_id),
    CONSTRAINT fk_conference_church FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE SET NULL,
    CONSTRAINT fk_conference_target_church FOREIGN KEY (target_church_id) REFERENCES churches(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;


-- =====================
-- GOOGLE SHEETS CONNECTION
-- =====================
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
                                                   id INT NOT NULL AUTO_INCREMENT,
                                                   user_id INT NULL,
                                                   google_email VARCHAR(255),
    refresh_token LONGTEXT NOT NULL,
    scope TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY one_connection (id)
    ) ENGINE=InnoDB;


-- =====================
-- REGISTRATIONS
-- =====================
CREATE TABLE IF NOT EXISTS registrations (
                                             id INT NOT NULL AUTO_INCREMENT,
                                             user_id INT NOT NULL,
                                             conference_id INT NOT NULL,
                                             payment_status VARCHAR(50) DEFAULT 'pending',
    registration_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_proof LONGTEXT,
    payment_proof_uploaded_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    shirt_size VARCHAR(20),
    transport_option VARCHAR(50),
    selected_days VARCHAR(50),
    selected_day_count INT DEFAULT 1,
    selected_price DECIMAL(10,2) NULL,
    admin_note TEXT,
    cancelled_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_registration (user_id, conference_id),
    KEY fk_reg_conference (conference_id),
    CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;


-- =====================
-- AUDIT LOGS
-- =====================
CREATE TABLE IF NOT EXISTS audit_logs (
                                          id INT NOT NULL AUTO_INCREMENT,
                                          actor_user_id INT NULL,
                                          action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_entity (entity_type, entity_id),
    KEY idx_audit_actor (actor_user_id),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;


-- =====================
-- EMAIL LOGS
-- =====================
CREATE TABLE IF NOT EXISTS email_logs (
                                          id INT NOT NULL AUTO_INCREMENT,
                                          actor_user_id INT NULL,
                                          conference_id INT NULL,
                                          registration_id INT NULL,
                                          email_type VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255),
    subject VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_email_conference (conference_id),
    KEY idx_email_registration (registration_id),
    KEY idx_email_actor (actor_user_id),
    CONSTRAINT fk_email_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_email_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE SET NULL,
    CONSTRAINT fk_email_registration FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;


-- =====================
-- APP SETTINGS
-- =====================
CREATE TABLE IF NOT EXISTS app_settings (
                                            setting_key VARCHAR(100) NOT NULL,
    setting_value LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (setting_key)
    ) ENGINE=InnoDB;


-- =====================
-- KHELWA ROOMS
-- =====================
CREATE TABLE IF NOT EXISTS khelwa_rooms (
                                            id INT NOT NULL AUTO_INCREMENT,
                                            room_number VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 3,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY room_number (room_number)
    ) ENGINE=InnoDB;


-- =====================
-- KHELWA RESERVATIONS
-- =====================
CREATE TABLE IF NOT EXISTS khelwa_reservations (
                                                   id INT NOT NULL AUTO_INCREMENT,
                                                   user_id INT,
                                                   requester_name VARCHAR(150) NOT NULL,
    requester_email VARCHAR(150) NOT NULL,
    requester_phone VARCHAR(50),
    reservation_type ENUM('single','group') DEFAULT 'single',
    stay_type ENUM('day','overnight') DEFAULT 'day',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    group_size INT DEFAULT 1,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    KEY user_id (user_id),
    CONSTRAINT khelwa_reservations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;


-- =====================
-- KHELWA GUESTS
-- =====================
CREATE TABLE IF NOT EXISTS khelwa_guests (
                                             id INT NOT NULL AUTO_INCREMENT,
                                             reservation_id INT NOT NULL,
                                             full_name VARCHAR(150) NOT NULL,
    age INT,
    notes TEXT,
    PRIMARY KEY (id),
    KEY reservation_id (reservation_id),
    CONSTRAINT khelwa_guests_ibfk_1 FOREIGN KEY (reservation_id) REFERENCES khelwa_reservations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;


-- =====================
-- ROOM ASSIGNMENTS
-- =====================
CREATE TABLE IF NOT EXISTS khelwa_room_assignments (
                                                       id INT NOT NULL AUTO_INCREMENT,
                                                       reservation_id INT NOT NULL,
                                                       room_id INT NOT NULL,
                                                       assigned_people INT NOT NULL,
                                                       assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                       PRIMARY KEY (id),
    KEY reservation_id (reservation_id),
    KEY room_id (room_id),
    CONSTRAINT khelwa_room_assignments_ibfk_1 FOREIGN KEY (reservation_id) REFERENCES khelwa_reservations(id) ON DELETE CASCADE,
    CONSTRAINT khelwa_room_assignments_ibfk_2 FOREIGN KEY (room_id) REFERENCES khelwa_rooms(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;


-- =====================
-- BLOCKED DATES
-- =====================
CREATE TABLE IF NOT EXISTS khelwa_blocked_dates (
                                                    id INT NOT NULL AUTO_INCREMENT,
                                                    blocked_date DATE NOT NULL,
                                                    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY blocked_date (blocked_date)
    ) ENGINE=InnoDB;


SET FOREIGN_KEY_CHECKS = 1;
