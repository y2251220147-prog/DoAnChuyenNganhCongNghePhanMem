# Event Management API

## Events

### Get all events

GET /api/events

Response
[
 {
  "id":1,
  "name":"Tech Conference"
 }
]

### Create event

POST /api/events

Body
{
 "name":"Tech Conference",
 "location":"Hall A",
 "date":"2026-03-20"
}

---

## Guests

GET /api/guests

POST /api/guests

Body
{
 "event_id":1,
 "name":"Nguyen Van A",
 "email":"<a@gmail.com>"
}

---

## Timeline

GET /api/timeline

POST /api/timeline

Body
{
 "event_id":1,
 "title":"Opening",
 "start_time":"09:00:00",
 "end_time":"10:00:00"
}

---

## Budget

GET /api/budgets

POST /api/budgets

Body
{
 "event_id":1,
 "item":"Decoration",
 "amount":5000000
}

---

## Checkin

POST /api/checkin

Body
{
 "guest_id":1
}
