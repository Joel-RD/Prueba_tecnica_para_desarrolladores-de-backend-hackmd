create table if not exists users (
    id serial primary key,
    first_name varchar(50) not null,
    last_name varchar(50) not null,
    date_birth DATE not null,
    address varchar(100) not null,
    token varchar(255),
    password varchar(120) not null,
    mobile_phone varchar(20) not null unique,
    email varchar(65) not null unique
);

-- Migracion para bases de datos existentes (renombra la columna con typo):
-- alter table users rename column addres to address;

-- Insert a test user into the users table (bcrypt hash de "123456")
insert into users (first_name, last_name, date_birth, address, password, mobile_phone, email)
values ('John', 'Doe', '1990-01-01', '123 Test Street', '$2b$15$j6xgenBq0AvUWAT8cmT94.tJFuXkA.bIVEwLcDTjdKBwGwWY2CAEW' ,'1234567890', 'johndoe@example.com');