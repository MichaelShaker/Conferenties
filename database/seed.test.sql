-- Repeatable local QA seed data.
-- Safe to run multiple times against the conferenties database.

INSERT INTO churches (id, name, city, country)
VALUES
    (1, 'Coptic Orthodox Diocese of the Netherlands', 'Amsterdam', 'Nederland'),
    (2, 'St. Mary Church', 'Amsterdam', 'Nederland'),
    (3, 'St. Mark Church', 'Utrecht', 'Nederland')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    city = VALUES(city),
    country = VALUES(country);

INSERT INTO users (name, email, password, role, email_verified, newsletter_enabled)
VALUES
    ('QA Admin', 'qa-admin@example.com', '$2b$10$4NlrFwAcybpCo5MWSaDB1u5kHCm2lYc./RAQbwYWjT5Wnul19DXzu', 'admin', 1, 1),
    ('QA User', 'qa-user@example.com', '$2b$10$9rQ.iLfB5bKbGOAuKBOAQ.0ZlYgPNzniuvjnoaZG0yxtWIDKU7cqa', 'user', 1, 1)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    role = VALUES(role),
    email_verified = VALUES(email_verified),
    newsletter_enabled = VALUES(newsletter_enabled);

INSERT INTO user_profiles (
    user_id, first_name, last_name, phone, birth_date, church_id, city,
    rank_title, confession_father, allergies, dietary_notes,
    shirt_size, transport_option, profile_completed
)
SELECT
    u.id,
    'QA',
    CASE WHEN u.email = 'qa-admin@example.com' THEN 'Admin' ELSE 'User' END,
    '+31600000000',
    '2000-01-01',
    2,
    'Amsterdam',
    'Lid',
    'Abouna Test',
    'Geen',
    'Geen',
    'M',
    'bus',
    1
FROM users u
WHERE u.email IN ('qa-admin@example.com', 'qa-user@example.com')
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    phone = VALUES(phone),
    birth_date = VALUES(birth_date),
    church_id = VALUES(church_id),
    city = VALUES(city),
    rank_title = VALUES(rank_title),
    confession_father = VALUES(confession_father),
    allergies = VALUES(allergies),
    dietary_notes = VALUES(dietary_notes),
    shirt_size = VALUES(shirt_size),
    transport_option = VALUES(transport_option),
    profile_completed = VALUES(profile_completed);

INSERT INTO conferences (
    title, category, location, conference_date, description, image_url,
    price, capacity, event_type, city, church_id, min_age, max_age,
    requires_church, requires_rank, requires_confession_father, requires_allergies,
    target_church_id, target_city, target_rank, payment_link,
    payment_contact_name, payment_contact_phone, payment_instructions,
    registration_deadline, email_subject, email_body
)
SELECT
    'QA Test Conferentie',
    'Test',
    'Amsterdam',
    DATE_ADD(CURDATE(), INTERVAL 30 DAY),
    'Testevent voor lokale QA van inschrijven, betalen, export en Google Sheets.',
    'https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1200&q=80',
    25.00,
    40,
    'national',
    'Amsterdam',
    2,
    12,
    35,
    1,
    0,
    0,
    0,
    NULL,
    NULL,
    NULL,
    'https://example.com/pay',
    'QA Treasurer',
    '+31600000001',
    'Gebruik je naam als betalingsomschrijving.',
    DATE_ADD(CURDATE(), INTERVAL 20 DAY),
    'QA Test event beschikbaar',
    'Dit is een testmail voor het QA testevent.'
WHERE NOT EXISTS (
    SELECT 1
    FROM conferences
    WHERE title = 'QA Test Conferentie'
);
