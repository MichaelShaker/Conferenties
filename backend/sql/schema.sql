CREATE DATABASE IF NOT EXISTS conferenties;
USE conferenties;

DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS conferences;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       name VARCHAR(100) NOT NULL,
                       email VARCHAR(150) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       role VARCHAR(50) DEFAULT 'user',
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conferences (
                             id INT AUTO_INCREMENT PRIMARY KEY,
                             title VARCHAR(255) NOT NULL,
                             category VARCHAR(100) NOT NULL,
                             location VARCHAR(255) NOT NULL,
                             conference_date DATE NOT NULL,
                             description TEXT,
                             image_url VARCHAR(500),
                             price DECIMAL(10,2) DEFAULT 0.00,
                             capacity INT DEFAULT 100,
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registrations (
                               id INT AUTO_INCREMENT PRIMARY KEY,
                               user_id INT NOT NULL,
                               conference_id INT NOT NULL,
                               payment_status VARCHAR(50) DEFAULT 'pending',
                               registration_status VARCHAR(50) DEFAULT 'pending',
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               UNIQUE KEY unique_registration (user_id, conference_id),
                               CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                               CONSTRAINT fk_reg_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
);

INSERT INTO conferences (title, category, location, conference_date, description, image_url, price, capacity)
VALUES
    ('Tech Future Summit 2026', 'Conferentie', 'Amsterdam', '2026-06-15', 'Een conferentie over technologie, AI en software innovatie.', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', 25.00, 250),
    ('Web Development Connect', 'Workshop', 'Rotterdam', '2026-07-10', 'Ontmoet developers, ontwerpers en bedrijven uit de webwereld.', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80', 15.00, 180),
    ('AI & Data Expo', 'Seminar', 'Utrecht', '2026-08-21', 'Een evenement gericht op machine learning, data science en praktische AI.', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', 0.00, 300),
    ('Kerst Diner 2026', 'Kerk evenement', 'Amsterdam', '2026-12-20', 'Een warme avond met samen eten, ontmoeting en een feestelijk programma voor de kerkelijke gemeenschap.', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80', 10.00, 200),
    ('Paas Diner 2026', 'Kerk evenement', 'Amstelveen', '2026-04-10', 'Een gezamenlijk paasdiner met familie, vrienden en gemeenteleden.', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80', 5.00, 150),
    ('Kerk Kamp Zomer 2026', 'Kamp', 'Apeldoorn', '2026-07-25', 'Een meerdaags jongerenkamp met geloof, ontspanning, activiteiten en onderwijs.', 'https://images.unsplash.com/photo-1505236732171-72a5b19c4981?auto=format&fit=crop&w=1200&q=80', 45.00, 120);