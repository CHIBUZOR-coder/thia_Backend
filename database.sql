CREATE DATABASE thiadataa;
CREATE TYPE role_enum AS ENUM ('ADMIN', 'USER');
CREATE TABLE IF NOT EXISTS cloth (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(255),
    style VARCHAR(255),
    category VARCHAR(255),
    price NUMERIC,
    image VARCHAR(255),
    status VARCHAR(50),
    description VARCHAR(255),
    size VARCHAR(50)
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
    CONSTRAINT user_review FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE -- If any row in user is deleted , the related row here will also be deleteddue to the ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    userId INT UNIQUE,
    CONSTRAINT cart_user FOREIGN KEY (userId) REFERENCES users (id)
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
    CONSTRAINT cart_cloth FOREIGN KEY (clothsId) REFERENCES cloths (id) ON DELETE CASCADE,
    CONSTRAINT unique_cart_item UNIQUE (cartId, clothsId)  --Ensure no duplicate cart - item pairs
);

