# Movie Reservation System

Project URL: https://roadmap.sh/projects/movie-reservation-system

## Overview

A movie reservation system allowing users to sign up, view movies, their schedules, and manage reservations/orders. Admins can manage movies, schedules, and user roles.

Built with Node.js, Express, and MySQL.

## Features

1. Authentication & Authorisation
    * User registration and login with JWT-based authentication.
    * Role based access control.
    * Admin-only capabilities.
2. Movie & Schedule Management (Admin only)
    * Add, update and delete movies.
    * Create and manage schedules for each movie.
    * Prevention of overlapping/clashing schedules for each cinema.
3. Reservation Management
    * View available movies and showtimes by date
    * Reservation of available seats.
    * Automatic cancellation of non-confirmed/tentative reservations.
    * Manual cancellation of confirmed reservations.

## API Endpoints

Documentation for each endpoint can be found in `/doc/api.md`.

## Database Design

<img src="./doc/movie-reservation-schema.png" alt="schema" width=900/>
