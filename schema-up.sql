CREATE DATABASE IF NOT EXISTS MovieReservation;
USE MovieReservation;

-- TABLES

CREATE TABLE Movie (
    id              BIGINT,
    name            VARCHAR(256) NOT NULL,
    description     VARCHAR(512) NOT NULL,
    duration        INT NOT NULL,  -- Minutes
    poster_image    BLOB,  -- Nullable
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

CREATE TABLE ScheduleSeries (
    id BIGINT,
    PRIMARY KEY (id)
);

CREATE TABLE Schedule (
    id                  BIGINT,
    cinema_id           BIGINT NOT NULL,
    location_id         BIGINT NOT NULL,
    movie_id            BIGINT NOT NULL,
    last_updated_by     BIGINT NOT NULL,
    start_time          DATETIME NOT NULL,
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
