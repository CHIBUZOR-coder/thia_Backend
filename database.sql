CREATE DATABASE thiadataa;
CREATE TYPE role_enum AS ENUM ('ADMIN', 'USER', 'Apprentice');
CREATE TYPE status_enum AS ENUM ('Completed', 'Pending');
CREATE TYPE payment_enum AS ENUM ('Paid', 'Pending') CREATE TABLE IF NOT EXISTS cloth (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(255),
    style VARCHAR(255),
    category VARCHAR(255),
    price NUMERIC,
    image VARCHAR(255),
    status VARCHAR(50),
    description VARCHAR(255),
    size NUMERIC
);
CREATE TABLE IF NOT EXISTS userr (
    id SERIAL PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    -- Store hashed passwords here
    phone TEXT,
    image TEXT DEFAULT NULL,
    role role_enum DEFAULT 'USER',
    review TEXT DEFAULT NULL
);
CREATE TABLE IF NOT EXISTS review (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT DEFAULT NULL,
    text TEXT NOT NULL,
    userId INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Automatically record last update time
    CONSTRAINT user_review FOREIGN KEY (userId) REFERENCES userr (id) ON DELETE CASCADE -- If any row in user is deleted , the related row here will also be deleteddue to the ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    userId INT UNIQUE,
    CONSTRAINT cart_user FOREIGN KEY (userId) REFERENCES userr (id)
);
CREATE TABLE IF NOT EXISTS cartItems (
    id SERIAL PRIMARY KEY,
    cartId INT NOT NULL,
    clothsId INT NOT NULL,
    amount DOUBLE PRECISION,
    paid BOOLEAN DEFAULT TRUE,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_key FOREIGN KEY (cartId) REFERENCES cart (id) ON DELETE CASCADE,
    CONSTRAINT cart_cloth FOREIGN KEY (clothsId) REFERENCES cloth (id) ON DELETE CASCADE,
    CONSTRAINT unique_cart_item UNIQUE (cartId, clothsId) --Ensure no duplicate cart - item pairs
);
CREATE TABLE IF NOT EXISTS cloth_reciept(
    id SERIAL PRIMARY KEY,
    userId INT NOT NULL,
    products JSONB NOT NULL,
    -- ✅ Added comma
    quantity INT,
    orderId TEXT,
    bill NUMERIC(10, 2),
    status status_enum DEFAULT 'Pending',
    image TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_key FOREIGN KEY (userId) REFERENCES userr (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS applicants (
    id SERIAL PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)


 CREATE TABLE IF NOT EXISTS apprentice (
    id SERIAL PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    payment payment_enum DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


) 

CREATE TABLE IF NOT EXISTS apprentice_reciept(
    id SERIAL PRIMARY KEY,
    apprenticeId INT NOT NULL,
    bill NUMERIC(10, 2),
    orderId TEXT,
     transactionId TEXT,
      status status_enum DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT apprentice_key FOREIGN KEY (apprenticeId) REFERENCES apprentice (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS applicants (
    id SERIAL PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    image TEXT DEFAULT NULL,
);
// // // // // // // // Constrian viewing // // // // // // // // // // //
SELECT conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f';
SELECT constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.key_column_usage
    JOIN information_schema.constraint_column_usage ON constraint_name = constraint_name
WHERE table_name = 'review';