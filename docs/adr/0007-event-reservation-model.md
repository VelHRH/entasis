# ADR-0007: City-scoped Events, two-stage intent, auto-composition at cutoff

Status: accepted
Date: 2026-07-23

## Context

The MVP turns a pool of interested people in a city into balanced rooms for a
weekly anonymous speed-dating night. Until now the repo had standalone Rooms
(joined manually) and no notion of an Event, a demand signal, or a commitment to
attend. We need to model how a night comes into being: who is eligible, who
actually shows up, and when rooms get built. This decision fixes that model; the
composition *algorithm* itself is ADR-0008.

Three questions had to be settled together because they constrain each other:

1. **What does an Event belong to?** The glossary's earlier working note had one
   date-only Event spanning all cities, with the city living on the Room. The
   product reality — "one event per city per week", each opening at its own local
   20:00, an admin creating an event *in a city* once demand there is enough —
   points the other way.
2. **What population feeds room composition, and how do people enter it?** The
   MVP wants both a demand signal (to decide an event is worth creating) and a
   show-up signal (so rooms aren't built from no-shows).
3. **When and how do rooms get built?** The brief said "when the system sees the
   event created, build rooms" — but at creation nobody has committed yet.

## Decision

### Events are city-scoped

An **Event** belongs to exactly one **City** and one date and runs under one
**Regime** (ADR forthcoming regimes; today only `SPEED_BLIND_DATING`). The same
Thursday in three cities is three Events. The Event's start is the City
timezone's 20:00 (City is seeded with its timezone). Rooms belong to an Event and
inherit its City; a Room carries an **age bracket**, not a city.

### Two-stage intent

Participation is a two-stage signal, and the first stage is free:

- **Standing intent** = having a complete Profile in a City. No separate opt-in
  screen. This is the demand signal an admin reads ("enough profiles in this city
  → create an Event"). When future regimes arrive, standing intent becomes
  per-regime without reworking the reservation flow.
- **Reservation** = an explicit, per-Event commitment ("I'll be there this
  Thursday"). Unique per `(user, event)`, own-city only. The set of Reservations
  is the sole input population to room composition.

This keeps the UX to one deliberate tap (reserve) while still gating rooms on
*will-come*, not merely *wants*.

### Auto-composition at a cutoff, driven by a reconciliation worker

An Event carries a **`reservationDeadline`** (the Cutoff), defaulting to
`start − regime.leadTime` (2h). Reservations close at the Cutoff and Rooms are
composed from the pool then — *not* at event creation.

The Cutoff is reached by a **periodic reconciliation worker**: a recurring Effect
fiber (poll ~60s) that finds Events where `status = SCHEDULED AND
reservationDeadline <= now` and composes each, flipping `SCHEDULED → COMPOSED` in
one atomic, idempotent transition. Event status for this stage is minimal:
`SCHEDULED | COMPOSED | CANCELLED`; the live-night states (lobby/round/results/
closed) arrive with the future WebSocket engine.

Rooms lock at composition. A later cancellation just leaves a smaller room; there
is no standby backfill yet (parked).

## Alternatives considered

### One global Event, city on the Room (the old glossary note)

Rejected: per-city reservation windows, cutoffs, and composition would all have to
be carved out *inside* one global Event, and "admin creates an event in a city"
would have no home. City-scoped Events make each night an independent unit with a
natural shard key (matching MVP §5's "cities never communicate").

### Pull all eligible profiles at creation (no reservation step)

Literally matched the brief but assigns people to a night they never opted into —
bad show-up rates, and no way to size rooms to real attendance. Rejected in favour
of the explicit Reservation.

### Explicit standing-intent opt-in (separate from having a Profile)

More friction now for a cleaner per-regime story later. Rejected: a completed
Profile *is* the intent; the per-regime split can be added when a second regime
actually exists.

### Per-event in-memory timers instead of a reconciliation worker

Fires exactly on time, but timers are in-memory and must be re-armed for every
future Event on each restart. The worker keeps all state in the DB, survives
restarts for free, and the poll granularity is irrelevant at a few events per
week.

## Consequences

- New `city` and `event` server modules; Profile joins the `user` module (1:1
  with User); a `role` column (`USER | ADMIN`) gates event creation. Domain gains
  matching schema folders with branded IDs.
- Room is refactored under Event (`event_id NOT NULL`, `age_bracket`); manual room
  create/join is removed and the chat prototype is left dormant for the future
  Layer B engine.
- The worker is the app's first background scheduler — a seam the future
  automated-event-creation issue can reuse.
- Verification is deferred: reserving requires only a complete Profile today; the
  future verification ticket wraps the reserve path with its gate.
