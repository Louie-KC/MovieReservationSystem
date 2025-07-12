CREATE DATABASE IF NOT EXISTS MovieReservation;
USE MovieReservation;

-- TABLES

CREATE TABLE Movie (
    id              BIGINT,
    name            VARCHAR(256) NOT NULL,
    description     VARCHAR(512) NOT NULL,
    duration        INT NOT NULL,  -- Minutes
    poster_image    BLOB,  -- Nullable
    available       BOOLEAN NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE MovieGenreCategory (
    genre_name VARCHAR(16),
    PRIMARY KEY (genre_name)
);

CREATE TABLE MovieGenre (
    movie_id    BIGINT,
    genre_name  VARCHAR(16),
    PRIMARY KEY (movie_id, genre_name),
    FOREIGN KEY (movie_id) REFERENCES Movie (id),
    FOREIGN KEY (genre_name) REFERENCES MovieGenreCategory (genre_name)
);

CREATE TABLE Location (
    id      BIGINT,
    address VARCHAR(256) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Cinema (
    id              BIGINT,
    location_id     BIGINT NOT NULL,
    friendly_name   VARCHAR(32) NOT NULL,
    PRIMARY KEY (id, location_id),
    FOREIGN KEY (location_id) REFERENCES Location (id)
);

CREATE TABLE CinemaSeat (
    id          CHAR(4),
    cinema_id   BIGINT,
    location_id BIGINT,
    kind        ENUM ('regular', 'luxury') NOT NULL,
    PRIMARY KEY (id, cinema_id, location_id),
    FOREIGN KEY (cinema_id, location_id) REFERENCES Cinema (id, location_id)
);

CREATE TABLE User (
    id              BIGINT,
    given_name      VARCHAR(128) NOT NULL,
    last_name       VARCHAR(128) NOT NULL,
    email_addr      VARCHAR(256) NOT NULL,
    password_hash   BIGINT NOT NULL,  -- TODO: Revisit once hash decided upon
    kind            ENUM ("admin", "customer") NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Schedule (
    id                  BIGINT,
    cinema_id           BIGINT NOT NULL,
    location_id         BIGINT NOT NULL,
    movie_id            BIGINT NOT NULL,
    last_updated_by     BIGINT NOT NULL,
    start_time          DATETIME NOT NULL,
    available           BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (cinema_id, location_id) REFERENCES Cinema (id, location_id),
    FOREIGN KEY (movie_id) REFERENCES Movie (id),
    FOREIGN KEY (last_updated_by) REFERENCES User (id)
);

CREATE TABLE Reservation (
    id              BIGINT,
    user_id         BIGINT, -- NULLABLE. Allow walk in customers make reservations
    schedule_id     BIGINT NOT NULL,
    kind            ENUM ("confirmed", "tentative", "cancelled") NOT NULL,
    last_updated    DATETIME NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES User (id),
    FOREIGN KEY (schedule_id) REFERENCES Schedule (id)
);

-- Devtest placeholder data
INSERT INTO Movie (id, name, description, duration, poster_image, available) VALUES
    (1, "Test Movie 1", "Placeholder description for Test Movie 1", 90, NULL, true),
    (2, "Test Movie 2", "Placeholder description for Test Movie 2", 110, NULL, true);

INSERT INTO MovieGenreCategory (genre_name) VALUES
    ("Action"),
    ("Thriller"),
    ("Comedy"),
    ("Horror"),
    ("Drama"),
    ("Science Fiction");

INSERT INTO MovieGenre (movie_id, genre_name) VALUES
    (1, "Comedy"),
    (1, "Science Fiction"),
    (2, "Thriller"),
    (2, "Horror"),
    (2, "Action");

INSERT INTO Location (id, address) VALUES
    (1, "100 George Street, Sydney NSW 2000"),
    (2, "55 King Street, Sydney NSW 2000");

INSERT INTO Cinema (id, location_id, friendly_name) VALUES
    (1, 1, "Cinema 1"),
    (2, 1, "Cinema 2"),
    (3, 1, "Cinema 3"),
    (1, 2, "Cinema 1");

INSERT INTO CinemaSeat (id, cinema_id, location_id, kind) VALUES
    ('-A01', 1, 1, "regular"),
    ('-A02', 1, 1, "regular"),
    ('-A03', 1, 1, "regular"),
    ('-A04', 1, 1, "regular"),
    ('-B01', 1, 1, "regular"),
    ('-B02', 1, 1, "regular"),
    ('-B03', 1, 1, "regular"),
    ('-B04', 1, 1, "regular"),

    ('-A01', 2, 1, "luxury"),
    ('-A02', 2, 1, "luxury"),
    ('-A03', 2, 1, "luxury"),
    ('-A04', 2, 1, "luxury"),
    ('-B01', 2, 1, "luxury"),
    ('-B02', 2, 1, "luxury"),
    ('-B03', 2, 1, "luxury"),
    ('-B04', 2, 1, "luxury"),
    
    ('-A01', 3, 1, "luxury"),
    ('-A02', 3, 1, "luxury"),
    ('-A03', 3, 1, "luxury"),
    ('-A04', 3, 1, "luxury"),
    ('-B01', 3, 1, "regular"),
    ('-B02', 3, 1, "regular"),
    ('-B03', 3, 1, "regular"),
    ('-B04', 3, 1, "regular"),

    ('-A01', 1, 2, "luxury"),
    ('-A02', 1, 2, "luxury"),
    ('-A03', 1, 2, "luxury"),
    ('-A04', 1, 2, "luxury"),
    ('-B01', 1, 2, "luxury"),
    ('-B02', 1, 2, "luxury"),
    ('-B03', 1, 2, "luxury"),
    ('-B04', 1, 2, "luxury");

INSERT INTO User (id, given_name, last_name, email_addr, password_hash, kind) VALUES
    (1, "Test admin 1", "last1", "admin1@admin.com", 0, "admin"),
    (2, "Test admin 2", "last2", "admin2@admin.com", 0, "admin"),
    (3, "Test customer 1", "customer1", "notreal1@fake.com", 0, "customer"),
    (4, "Test customer 2", "customer2", "notreal2@fake.com", 0, "customer");

INSERT INTO Schedule (id, cinema_id, location_id, movie_id, last_updated_by, start_time, available) VALUES
    ( 1, 1, 1, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 10:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    ( 2, 1, 1, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 12:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    ( 3, 1, 1, 2, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 14:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    ( 4, 1, 1, 2, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 17:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    ( 5, 2, 1, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 11:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    ( 6, 2, 1, 2, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 14:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    ( 7, 2, 1, 2, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 10:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    ( 8, 3, 1, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 11:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    ( 9, 3, 1, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 15:00:00'), "%Y-%m-%d %H:%i:%s"), true),

    (10, 1, 2, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 10:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    (11, 1, 2, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 13:00:00'), "%Y-%m-%d %H:%i:%s"), true),
    (12, 1, 2, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 15:30:00'), "%Y-%m-%d %H:%i:%s"), true),
    (13, 1, 2, 1, 1, STR_TO_DATE(CONCAT(CURDATE(), ' 18:30:00'), "%Y-%m-%d %H:%i:%s"), true);

INSERT INTO Reservation (id, user_id, schedule_id, kind, last_updated) VALUES
    (1, 3,  1, "confirmed", NOW()),
    (2, 3,  4, "confirmed", NOW()),
    (3, 4,  1, "confirmed", NOW()),
    (4, 4, 12, "confirmed", NOW());
