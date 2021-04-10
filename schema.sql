DROP TABLE IF EXISTS books;
create table books (
    id SERIAL primary key not null,
    title VARCHAR(255),
    author VARCHAR(255),
    isbn VARCHAR(255),
    image_url VARCHAR(255),
    Description TEXT,
    offShelf VARCHAR(255)
);



