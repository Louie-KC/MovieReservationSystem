# API endpoints

## Available endpoints
Manage account (`/account`)

* [POST /account/register](#post-accountregister)
* [POST /account/login](#post-accountlogin)
* [POST /account/change-password](#post-accountchange-password)

Locations, cinemas, movies and schedules

* [GET /location](#get-location)
* [GET /movie?genre={genre}](#get-moviegenregenre)
* [GET /movie/{movie id}](#get-moviemovie-id)
* [GET /schedule?location={location id}?&date={YYYY-MM-DD}](#get-schedulelocationlocation-iddateyyyy-mm-dd)
* [GET /schedule/{schedule id}](#get-scheduleschedule-id)
* [GET /schedule/{schedule id}/seats](#get-scheduleschedule-idseats)

Orders (`/order`)

* [GET  /order/history](#get-orderhistory)
* [POST /order/reserve](#post-orderreserve)
* [POST /order/confirm](#post-orderconfirm)
* [POST /order/cancel](#post-ordercancel)

Admin: Accounts

* [GET /accounts/{account id}](#get-accountsaccount-id)
* [GET /accounts?name={name part}&email={email part}](#get-accountsnamename-partemailemail-part)

Admin: Movies

* [PUT    /movie](#put-movie)
* [POST   /movie/{movie id}](#post-moviemovie-id)
* [PATCH  /movie/{movie id}](#patch-moviemovie-id)
* [DELETE /movie/{movie id}](#delete-moviemovie-id)

Admin: Schedule

* [GET    /schedule/{location id}/{cinema id}?date={YYYY-MM-DD}](#get-schedulelocation-idcinema-iddateyyyy-mm-dd)
* [PUT    /schedule](#put-schedule)
* [POST   /schedule/{schedule id}](#post-scheduleschedule-id)
* [DELETE /schedule/{schedule id}](#delete-scheduleschedule-id)

Admin: Aux

* [POST /admin/promote-to-admin](#post-adminpromote-to-admin)

### POST /account/register
Register a new user account.

### POST /account/login
Authenticate a user. Return auth token.

### POST /account/change-password
Change the password of the logged in user (token).

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

### GET /movie#genre={genre}
Retrieve a list of all movies matching the provided `genre` (if specified)

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

### GET /movie/{movie id}
Retrieve information about a movie.

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

### GET /schedule?location={location id}?&date={YYYY-MM-DD}
Retrieve the schedules for movies at a location.

The `location` parameter must be specified to get a result.
If the `date` parameter is not specified, the current date is assumed.

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
              "poster": <TODO: Movie poster>,
              "schedule": [
                  {
                  "id": <schedule id>,
                  "time": <schedule start time>,
                  "seats": <number of seats remaining>
                  },
                  ...
              ]
          },
          ...
      ]
      ```

### GET /schedule/{schedule id}
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

### GET /schedule/{schedule id}/seats
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

### GET /order/history
Retrieve a list of bookings for a logged in user (token).

* Authentication: Bearer
* Possible responses:
    * HTTP 200 OK: Success
      ```json
      [
          {
              "id": <ticket ID>,
              "status": "confirmed" | "tentative" | "cancelled",
              "time": <ticket movie start time>,
              "address": <location address>,
              "cinema": <cinema friendly name>,
              "seats": [
                  <seat id 1>,
                  <seat id 2>,
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
          <seat id 1>,
          <seat id 2>,
          ...
      ]
  }
  ```
* Possible responses:
    * HTTP 200 OK:
      ```json
      {
          "id": <reserved ticket ID>
      }
      ```
    * HTTP 400 Bad Request: (see reason)
        * Invalid schedule ID
        * Schedule start time is in the past
        * Seats are unavailable
    * HTTP 401 Unauthorised: Invalid token.

### POST /order/confirm
Confirm an order for a reserved movie ticket.

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "id": <reserved ticket ID>
  }
  ```
* Possible responses
    * HTTP 200 OK: Ticket has been successfully reserved
    * HTTP 400 Bad Request: (see reason)
        * The reservation has expired/is no longer tentative.
        * The reservation ID is invalid (does exist or for another user).
    * HTTP 401 Unauthorised: Invalid token.

### POST /order/cancel
Cancel an order for a movie ticket. Cancellations are only possible if the start time is in the future.

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "id": <ticket ID>
  }
  ```
* Possible responses
    * HTTP 200 Ok: Ticket has been successfully cancelled.
    * HTTP 400 Bad Request: (see reason)
        * The start time of the ticket movie has passed.
        * Invalid ticket ID
        * Ticket already cancelled
    * HTTP 401 Unauthorised: Invalid token.


### GET /accounts/{account id}
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
    * HTTP 401 Unauthorised: No permission.


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
    * HTTP 401 Unauthorised: No permission.

### PUT /movie
Add a new movie.

* Authentication: Bearer
* Expected JSON payload:
  ```json
  {
      "title": <movie title>,
      "description": <movie description>,
      "duration": <movie duration in minutes>,
      "poster": <TODO: Movie poster>
  }
  ```

### POST /movie/{movie id}
Update movie detail(s).

Note: The JSON payload should only state keys and values for the fields being updated. Non-updated fields should be excluded.

* Authentication: Bearer
* Example JSON payload: Update the description of a movie
  ```json
  {
      "description": <The new movie description>
  }
  ```
* Possible responses:
    * HTTP 200 OK: Success
    * HTTP 400 Bad Request: One or more field names are invalid. No changes made.
    * HTTP 401 Unauthorised: No permission.

### PATCH /movie/{movie id}
Toggle between making a movie available and unavailable.

Side effect: Marks all future schedules with no confirmed orders/tickets for the movie as (un)available. All schedules with confirmed orders/tickets will remain, and have their IDs returned.

Side effect: When marking as unavailable making all tentative/reservation orders/tickets are cancelled.

* Authentication: Bearer
* Possible responses:
    * HTTP 200 OK: Some schedules for the movie cannot be made unavailable.
      ```json
      {
          "schedule ids": [<schedule id 1>, <schedule id 2>, ...]
      }
      ```
    * HTTP 204 No Content: The movie and its future schedules have been successfully marked as unavailable.
    * HTTP 400 Bad Request: Invalid movie ID.
    * HTTP 401 Unauthorised: No permission.

### DELETE /movie/{movie id}
Delete a movie.

* Authentication: Bearer
* Possible responses:
    * HTTP 204 No Content: Movie and its schedules were successfully deleted.
    * HTTP 400 Bad Request: Schedules with confirmed orders/tickets exist for movie.
      ```json
      {
          "schedule ids": [<schedule id 1>, <schedule id 2>, ...]
      }
      ```
    * HTTP 400 Bad Request: Invalid movie ID.
    * HTTP 401 Unauthorised: No permission.

### GET /schedule/{location id}/{cinema id}?date={YYYY-MM-DD}
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

### PUT /schedule
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
    * HTTP 200 OK: Success
    * HTTP 400 Bad Request: (See reason)
        * The new schedule overlaps with existing schedule(s).
        * Start time is in the past.
        * One or more expected fields are missing.
        * Invalid movie, location, or cinema ID.
    * HTTP 401 Unauthorised: No permission.

### POST /schedule/{schedule id}
Update an existing schedule. Note that this will only succeed if no confirmed orders/tickets exist for the schedule. All tentative orders/tickets for the schedule are cancelled.

Note: The JSON payload should only state keys and values for the fields being updated. Non-updated fields should be excluded.

* Authorisation: Bearer
* Example JSON payload: Update the cinema for the scheduled showing
  ```json
  {
      "cinema id": <the new cinema id>
  }
  ```
* Possible responses:
    * HTTP 200 OK: Success
    * HTTP 400 Bad Request: One or more field names are invalid. No changes made.
    * HTTP 401 Unauthorised: No permission.

### DELETE /schedule/{schedule id}
Delete a schedule. 

* Authorisation: Bearer
    * HTTP 204 No Content: Schedule successfully deleted.
    * HTTP 400 Bad Request: Confirmed orders/tickets exist for the schedule.
      ```json
      {
          "ids": [<ticket id 1>, <ticket id 2>, ...]
      }
      ```
    * HTTP 400 Bad Request: Invalid schedule ID.
    * HTTP 401 Unauthorised: No permission.

### POST /admin/promote-to-admin
Upgrade an accounts role from customer to admin.

* Authorisation: Bearer
* Expected JSON payload:
  ```json
  {
      "account id": <promotee account id>
  }
  ```
* Possible responses:
    * HTTP 200 OK: Success
    * HTTP 400 Bad Request: (see reason)
        * Invalid account ID
        * Account already an admin
    * HTTP 401 Unauthorised: No permission