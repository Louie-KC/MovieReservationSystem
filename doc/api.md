# API endpoints

## Available endpoints
Manage account (`/account`)

* [POST /account/register](#post-accountregister)
* [POST /account/login](#post-accountlogin)
* [POST /account/change-password](#post-accountchange-password)

Locations, cinemas, movies and schedules

* [GET /location](#get-location)
* [GET /movie?genre={genre}](#get-moviegenregenre)
* [GET /movie/{movie_id}](#get-moviemovie_id)
* [GET /schedule?location={location_id}?&date={YYYY-MM-DD}](#get-schedulelocationlocation_iddateyyyy-mm-dd)
* [GET /schedule/{schedule_id}](#get-scheduleschedule_id)
* [GET /schedule/{schedule_id}/seats](#get-scheduleschedule_idseats)

Orders (`/order`)

* [GET  /order/history](#get-orderhistory)
* [POST /order/reserve](#post-orderreserve)
* [POST /order/confirm](#post-orderconfirm)
* [POST /order/cancel](#post-ordercancel)

Admin: Accounts

* [GET /accounts/{account_id}](#get-accountsaccount_id)
* [GET /accounts?name={name part}&email={email part}](#get-accountsnamename-partemailemail-part)

Admin: Movies

* [POST   /movie](#post-movie)
* [PUT    /movie/{movie_id}](#put-moviemovie_id)
* [DELETE /movie/{movie_id}](#delete-moviemovie_id)

Admin: Schedule

* [GET    /schedule/{location_id}/{cinema_id}?date={YYYY-MM-DD}](#get-schedulelocation_idcinema_iddateyyyy-mm-dd)
* [POST   /schedule](#post-schedule)
* [PUT    /schedule/{schedule_id}](#put-scheduleschedule_id)
* [DELETE /schedule/{schedule_id}](#delete-scheduleschedule_id)

Admin: Aux

* [POST /admin/promote-to-admin](#post-adminpromote-to-admin)

### POST /account/register
Register a new user account.

* Authentication: None
* Expected JSON payload:
  ```json
  {
      "given_name": <given name(s)>,
      "last_name": <last name>,
      "email": <email address>,
      "password": <password>
  }
  ```
* Possible responses
    * HTTP 200 OK: Success
    * HTTP 400 Bad Request: (see reason)
        * Digits and/or symbols in name fields
        * Invalid email address format
        * email address is already in use
        * Password length not in range 4..128

### POST /account/login
Authenticate a user and receive an authentication token.

* Authentication: None
* Expected JSON payload:
  ```json
  {
      "email": <email address>,
      "password": <password>
  }
* Possible responses
    * HTTP 200 OK: Success
      ```json
      {
        "token": <auth token>
      }
      ```
    * HTTP 400 Bad Request:
        * Invalid email address format
        * Invalid password format
    * HTTP 401 Unauthorised:
        * Incorrect email & password pair

### POST /account/change-password
Change the password of the logged in user (token).

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "old": <old password>,
      "new": <new password>
  }
  ```
* Possible responses
    * HTTP 200 OK: Success
    * HTTP 400 Bad Request:
        * The old & new password are the same
        * The new password length not in range 4..128
    * HTTP 401 Unauthorized:
        * Missing or invalid JWT
        * Incorrect old password

### GET /location
Retrieve a list of all locations.

* Authentication: None
* Response:
    * HTTP 200 OK: Success
      ```json
      [
          {
              "id": <location ID>,
              "address": <address>
          },
          ...
      ]
      ```

### GET /movie?genre={genre}
Retrieve a list of all available movies matching the provided `genre` (if specified). Movies marked as unavailable will not be returned.

* Authentication: None
* Response:
    * HTTP 200 OK: Success
      ```json
      [
          {
              "id": <movie id>,
              "title": <movie title>,
              "description": <movie description>,
              "duration": <movie duration in minutes>,
              "poster": <TODO: Movie poster>
          },
          ...
      ]
      ```

### GET /movie/{movie_id}
Retrieve information about a movie. 

Information about movies that have been marked as unavailable is still accessible by this route when the ID is known (e.g. from a users reservation/order history).

* Authentication: None
* Response
    * HTTP 200 OK: Success
      ```json
      {
          "title": <movie title>,
          "description": <movie description>,
          "duration": <movie duration in minutes>,
          "poster": <TODO: Movie poster>,
          "genres": [
              <genre 1>,
              <genre 2>,
              ...
          ]
      }
      ```
    * HTTP 400 Bad Request:
        * Invalid movie_id format. Digits only.
    * HTTP 404 Not Found:
        * Invalid movie_id.

### GET /schedule?location={location_id}&date={YYYY-MM-DD}
Retrieve the schedules for specific location cinema.

The `location` parameter must be specified to get a result.
If the `date` parameter is not specified, the current date is assumed.

* Authentication: None
* Response:
    * HTTP 200 OK: Success
        ```json
        [
            {
                "id": <schedule ID>,
                "time": <start time>,
                "movie": <movie ID>
            },
            ...
        ]
        ```
    * HTTP 400 Bad Request:
        * Invalid location_id format
        * Invalid cinema_id format
        * Invalid date format
    * HTTP 401 Unauthorized:
        * Invalid or missing JWT
        * No permission

### GET /schedule/{schedule_id}
Retrieve information about a schedule.

* Authentication: None
* Response:
    * HTTP 200 OK: Success
      ```json
      {
          "address": <location address>,
          "cinema": <cinema friendly name>,
          "title": <movie title>,
          "poster": <TODO: movie poster>,
          "time": <scheduled start time>,
          "seats": <number of available seats>
      }
      ```
    * HTTP 400 Bad Request:
        * Invalid schedule_id format
    * HTTP 404 Not Found:
        * Invalid schedule_id

### GET /schedule/{schedule_id}/seats
Retrieve the seating and availability information for a scheduled movie.

* Authentication: None
* Response:
    * HTTP 200 OK: Success
      ```json
      [
          {
              "id": <seat identifier>,
              "available": True | False
          },
          ...
      ]
      ```
    * HTTP 400 Bad Request:
        * Invalid schedule_id format
    * HTTP 404 Not Found:
        * Invalid schedule_id

### GET /order/history
Retrieve a list of bookings for a logged in user (token).

* Authentication: Bearer
* Possible responses:
    * HTTP 200 OK: Success
      ```json
      [
          {
              "reservation": <reservation ID>,
              "schedule": <schedule ID>,
              "status": "confirmed" | "tentative" | "cancelled",
              "title": <movie title>,
              "time": <ticket movie start time>,
              "address": <location address>,
              "cinema": <cinema friendly name>,
              "seats": [
                  <seat label 1>,
                  <seat label 2>,
                  ...
              ]
          },
          ...
      ]
      ```
    * HTTP 400 Bad Request: Missing token.
    * HTTP 401 Unauthorised: Invalid token.

### POST /order/reserve
Temporarily reserve a ticket and its accompanying seats for a scheduled movie.

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "schedule": <schedule ID>,
      "seats": [
          <seat label 1>,
          <seat label 2>,
          ...
      ]
  }
  ```
* Possible responses:
    * HTTP 200 OK:
      ```json
      {
          "id": <reservation ID>
      }
      ```
    * HTTP 400 Bad Request: (see reason)
        * Invalid reservation ID
        * Schedule start time is in the past
        * Seats are unavailable
    * HTTP 401 Unauthorised: Invalid token.

### POST /order/confirm
Confirm an order for a reserved movie ticket.

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "id": <reservation ID>
  }
  ```
* Possible responses
    * HTTP 200 OK: Ticket/reservation has been successfully confirmed
    * HTTP 400 Bad Request: (see reason)
        * The reservation has expired/is no longer tentative.
        * The reservation ID is invalid (does exist or for another user).
    * HTTP 401 Unauthorised: Invalid token.

### POST /order/cancel
Cancel an order for a movie ticket/reservation. Cancellations are only possible if the start time is in the future.

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "id": <reservation ID>
  }
  ```
* Possible responses
    * HTTP 200 Ok: Ticket/reservation has been successfully cancelled.
    * HTTP 400 Bad Request: (see reason)
        * The start time of the ticket movie has passed.
        * Invalid reservation ID
        * Ticket/reservation already cancelled
    * HTTP 401 Unauthorised: Invalid token.


### GET /accounts/{account_id}
ADMIN

Retrieve information about a specific account.

* Authentication: Bearer
* Possible responses:
    * HTTP 200 OK: Success
      ```json
      {
          "id": <account ID>,
          "given": <given name>,
          "last": <last name>,
          "email": <email address>
      },
      ```
    * HTTP 400 Bad Request:
        * Invalid account_id format
        * account_id is not mapped to an account/user.
    * HTTP 401 Unauthorised:
        * Missing or invalid JWT
        * No permission

### GET /accounts?name={name part}&email={email part}
Retrieve account IDs that partially match the `name` and/or `email` parts. At least one of the parameters must be set with a minimum length of 3 characters.

* Authentication: Bearer
* Possible responses:
    * HTTP 200 OK: Success
      ```json
      [
          {
              "id": <account ID>,
              "given": <given name>,
              "last": <last name>,
              "email": <email address>
          },
          ...
      ]
      ```
    * HTTP 400 Bad Request:
        * One or both query parameters are too short. min 3 chars
        * Invalid format for email query parameter
        * Invalid format for name query parameter
    * HTTP 401 Unauthorised:
        * Missing or invalid JWT
        * No permission

### POST /movie
Record a new movie.

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "title": <movie title>,
      "description": <movie description>,
      "duration": <movie duration in minutes>,
      "poster": <TODO: Movie poster>,
      "genres": [ <Genre 1>, <Genre 2>, ... ]
  }
  ```
* Possible responses:
    * HTTP 201 Created:
    ```json
    {
        "id": <created movie id>
    }
    ```
    * HTTP 400 Bad Request:
        * Missing fields in request body
        * Invalid field value(s) in request body
    * HTTP 401 Unauthorized
        * Missing or invalid JWT
        * No permission

### PUT /movie/{movie_id}
Update movie details.

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "title": <movie title>,
      "description": <movie description>,
      "duration": <movie duration in minutes>,
      "poster": <TODO: Movie poster>,
      "genres": [ <Genre 1>, <Genre 2>, ... ]
  }
  ```
* Possible responses:
    * HTTP 200 Ok: Success
    * HTTP 400 Bad Request:
        * Invalid movie_id format
        * Missing fields in request body
        * Invalid field value(s) in request body
    * HTTP 401 Unauthorized
        * Missing or invalid JWT
        * No permission
    * HTTP 404 Not Found:
        * movie_id does not map to a movie

### DELETE /movie/{movie_id}
Soft delete a movie.

Soft deletion is blocked if any confirmed reservations exist for a scheduling of the movie in the future.
An optional `force` query parameter (no value is required) can be specified which will cancel all confirmed future reservations. All tentative reservations are cancelled (regardless of `force`).

* Authentication: Bearer
* Possible responses:
    * HTTP 200 Ok: Success
    * HTTP 400 Bad Request:
        * Invalid movie_id format
    * HTTP 401 Unauthorised:
        * Missing or invalid JWT
        * No permission
    * HTTP 404 Not Found:
        * movie_id does not map to a movie
    * HTTP 409 Conflict:
        * Confirmed schedule reservations exist.

### GET /schedule/{location_id}/{cinema_id}?date={YYYY-MM-DD}
Retrieve the movie schedule for a specific cinema on a date. The `date` parameter must be specified.

* Authorisation: Bearer
* Possible responses:
    * HTTP 200 OK: Success
      ```json
      [
          {
              "id": <schedule id>,
              "title": <movie title>,
              "start": <start time>,
              "end": <end time>
          },
          ...
      ]
      ```
    * HTTP 400 Bad Request:
        * Invalid location_id format
        * Invalid cinema_id format
        * Missing date parameter
    * HTTP 401 Unauthorized:
        * Missing or invalid JWT
        * No permission
    * HTTP 404 Not Found:
        * Invalid location_id and cinema_id combination
        * No schedules

### POST /schedule
Add a new scheduled showing for a movie.

* Authorisation: Bearer
* Expected JSON payload:
  ```json
  {
      "movie": <movie id>,
      "location": <location id>,
      "cinema": <cinema id>,
      "time": <start date time>
  }
  ```
* Possible responses:
    * HTTP 201 OK: Success
    ```json
    {
        id: <new schedule ID>
    }
    ```
    * HTTP 400 Bad Request: (See reason)
        * The new schedule overlaps with existing schedule(s).
        * Start time is in the past.
        * One or more expected fields are missing.
        * Invalid movie, location, or cinema ID.
    * HTTP 401 Unauthorised:
        * Missing or invalid JWT
        * No permission

### PUT /schedule/{schedule_id}
Update an existing schedule.

The schedule update is blocked if any confirmed reservations/orders exist for the schedule.
An optional `force` query paramete r(no value is required) can be specified to prevent blocking by confirmed reservations. If set, the schedule details will change regardless and users with confirmed reservations will see the new schedule.
Tentative reservations/orders will not block the update, and will appear changed on the users end similar to enabling force and confirmed reservations.

* Authorisation: Bearer
* Expected JSON payload:
  ```json
  {
      "movie": <movie id>,
      "location": <location id>,
      "cinema": <cinema id>,
      "time": <start date time>
  }
  ```
* Possible responses:
    * HTTP 200 OK: Success
    * HTTP 400 Bad Request:
        * Invalid schedule_id format.
        * One or more field values are invalid.
    * HTTP 401 Unauthorised:
        * Missing or invalid JWT
        * No permission
    * HTTP 404 Not Found:
        * schedule_id does not exist
    * HTTP 409 Conflict:
        * Confirmed reservations exist for the schedule.

### DELETE /schedule/{schedule_id}
Soft delete a schedule.

Soft deletion is blocked if there are any confirmed reservations for the schedule.
An optional `force` query parameter (no value is required) can be specified which will cancel all reservations.

* Authorisation: Bearer
    * HTTP 200 Ok: Success
    * HTTP 400 Bad Request:
        * Invalid schedule_id format
    * HTTP 401 Unauthorised:
        * Missing or invalid JWT
        * No permission
    * HTTP 404 Not Found:
        * schedule_id does not map to a schedule
    * HTTP 409 Conflict:
        * Confirmed schedule reservations exist

### POST /admin/promote-to-admin
Upgrade an accounts role from customer to admin.

* Authorisation: Bearer
* Expected JSON payload:
  ```json
  {
      "account_id": <promotee account id>
  }
  ```
* Possible responses:
    * HTTP 200 OK: Success
    * HTTP 400 Bad Request: (see reason)
        * Invalid account ID
        * Account already an admin
    * HTTP 401 Unauthorised:
        * Missing or invalid JWT
        * No permission