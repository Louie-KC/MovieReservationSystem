SET GLOBAL event_scheduler = ON;

CREATE DATABASE IF NOT EXISTS MovieReservation;
USE MovieReservation;

-- TABLES

CREATE TABLE Movie (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    title           VARCHAR(256) NOT NULL,
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
    movie_id    BIGINT NOT NULL AUTO_INCREMENT,
    genre_name  VARCHAR(16),
    PRIMARY KEY (movie_id, genre_name),
    FOREIGN KEY (movie_id) REFERENCES Movie (id),
    FOREIGN KEY (genre_name) REFERENCES MovieGenreCategory (genre_name)
);

CREATE TABLE Location (
    id      BIGINT NOT NULL AUTO_INCREMENT,
    address VARCHAR(256) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Cinema (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    location_id     BIGINT NOT NULL,
    friendly_name   VARCHAR(32) NOT NULL,
    PRIMARY KEY (id, location_id),
    FOREIGN KEY (location_id) REFERENCES Location (id)
);

CREATE TABLE CinemaSeat (
    id          BIGINT,
    cinema_id   BIGINT  NOT NULL,
    location_id BIGINT  NOT NULL,
    seat_row    CHAR(1) NOT NULL,
    seat_number INT     NOT NULL,
    kind        ENUM ('regular', 'luxury') NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (cinema_id, location_id) REFERENCES Cinema (id, location_id)
);

CREATE TABLE User (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    given_name      VARCHAR(128) NOT NULL,
    last_name       VARCHAR(128) NOT NULL,
    email_addr      VARCHAR(256) NOT NULL,
    password_hash   BIGINT NOT NULL,  -- TODO: Revisit once hash decided upon
    kind            ENUM ("admin", "customer") NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Schedule (
    id                  BIGINT NOT NULL AUTO_INCREMENT,
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
    id              BIGINT NOT NULL AUTO_INCREMENT,
    user_id         BIGINT, -- NULLABLE. Allow walk in customers make reservations
    schedule_id     BIGINT NOT NULL,
    kind            ENUM ("confirmed", "tentative", "cancelled") NOT NULL,
    last_updated    DATETIME NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES User (id),
    FOREIGN KEY (schedule_id) REFERENCES Schedule (id)
);

CREATE TABLE ReservationSeat (
    reservation_id  BIGINT,
    seat_id         BIGINT,
    PRIMARY KEY (reservation_id, seat_id),
    FOREIGN KEY (reservation_id) REFERENCES Reservation (id),
    FOREIGN KEY (seat_id) REFERENCES CinemaSeat (id)
);

-- Devtest placeholder data
INSERT INTO Movie (id, title, description, duration, poster_image, available) VALUES
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

INSERT INTO CinemaSeat (id, cinema_id, location_id, seat_row, seat_number, kind) VALUES
    ( 1, 1, 1, 'A', 1, "regular"),
    ( 2, 1, 1, 'A', 2, "regular"),
    ( 3, 1, 1, 'A', 3, "regular"),
    ( 4, 1, 1, 'A', 4, "regular"),
    ( 5, 1, 1, 'B', 1, "regular"),
    ( 6, 1, 1, 'B', 2, "regular"),
    ( 7, 1, 1, 'B', 3, "regular"),
    ( 8, 1, 1, 'B', 4, "regular"),

    ( 9, 2, 1, 'A', 1, "luxury"),
    (10, 2, 1, 'A', 2, "luxury"),
    (11, 2, 1, 'A', 3, "luxury"),
    (12, 2, 1, 'A', 4, "luxury"),
    (13, 2, 1, 'B', 1, "luxury"),
    (14, 2, 1, 'B', 2, "luxury"),
    (15, 2, 1, 'B', 3, "luxury"),
    (16, 2, 1, 'B', 4, "luxury"),
    
    (17, 3, 1, 'A', 1, "luxury"),
    (18, 3, 1, 'A', 2, "luxury"),
    (19, 3, 1, 'A', 3, "luxury"),
    (20, 3, 1, 'A', 4, "luxury"),
    (21, 3, 1, 'B', 1, "regular"),
    (22, 3, 1, 'B', 2, "regular"),
    (23, 3, 1, 'B', 3, "regular"),
    (24, 3, 1, 'B', 4, "regular"),

    (25, 1, 2, 'A', 1, "luxury"),
    (26, 1, 2, 'A', 2, "luxury"),
    (27, 1, 2, 'A', 3, "luxury"),
    (28, 1, 2, 'A', 4, "luxury"),
    (29, 1, 2, 'B', 1, "luxury"),
    (30, 1, 2, 'B', 2, "luxury"),
    (31, 1, 2, 'B', 3, "luxury"),
    (32, 1, 2, 'B', 4, "luxury");

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

INSERT INTO ReservationSeat (reservation_id, seat_id) VALUES
    -- All of the below are for reservations in location 1 cinema 1.
    (1, 1),
    (1, 2),
    (1, 3),
    (2, 1),
    (3, 8),
    (4, 2),
    (4, 3),
    (4, 6),
    (4, 7);

-- Triggers, procedures & events

DELIMITER //

CREATE TRIGGER trig_upd_valid_reservation_cancel
BEFORE UPDATE
ON Reservation
FOR EACH ROW
BEGIN
    -- Ensure the reservation being cancelled is not scheduled in the past.
    DECLARE error_msg VARCHAR(64);
    DECLARE scheduled_time DATETIME;

    SELECT sch.start_time INTO scheduled_time
    FROM Schedule sch
    WHERE sch.id = OLD.schedule_id
    LIMIT 1;

    IF scheduled_time < NOW() THEN
        SET error_msg = CONCAT("Scheduled time ",
                                DATE_FORMAT(scheduled_time, "%d %m %Y"),
                                " is in the past");
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
    END IF;
END //

CREATE PROCEDURE proc_cancel_old_tentative_reservations()
COMMENT "Cancel tentative tickets/reservations that have not been updated in over 5 minutes."
BEGIN
    UPDATE Reservation
    SET kind = "cancelled"
    WHERE kind = "tentative"
    AND UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(last_updated) > 300;  -- 5 minutes
END //

CREATE EVENT event_tentative_reservation_cleanup
ON SCHEDULE
    EVERY 30 SECOND
COMMENT "Cancel old tentative reservations every 30 seconds."
DO
BEGIN
    CALL proc_cancel_old_tentative_reservations();
END //

DELIMITER ;
