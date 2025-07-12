USE MovieReservation;

DROP EVENT IF EXISTS event_tentative_reservation_cleanup;
DROP PROCEDURE IF EXISTS proc_cancel_old_tentative_reservations;
DROP TRIGGER IF EXISTS trig_upd_valid_reservation_cancel;

-- TABLES

DROP TABLE IF EXISTS Reservation;
DROP TABLE IF EXISTS ScheduleSeries;
DROP TABLE IF EXISTS Schedule;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS CinemaSeat;
DROP TABLE IF EXISTS Cinema;
DROP TABLE IF EXISTS Location;
DROP TABLE IF EXISTS MovieGenre;
DROP TABLE IF EXISTS MovieGenreCategory;
DROP TABLE IF EXISTS Movie;
