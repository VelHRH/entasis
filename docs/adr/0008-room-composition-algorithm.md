# ADR-0008: Room composition — compatibility-graph viability and drop-streak fairness

Status: accepted
Date: 2026-07-23

## Context

At the Cutoff (ADR-0007) an Event's Reservations must be turned into Rooms. This
is *Layer A* — partitioning the pool into the 30–60-person groups that spend the
night together. The round-by-round 1-on-1 pairing *inside* a Room (*Layer B*) is
the separate future real-time engine and is out of scope here; the two share a
compatibility primitive but run at different times.

Composition is not "chop into groups of N". Gender/orientation is modelled richly
(`gender ∈ {MALE, FEMALE, NONBINARY}`, `interestedIn` a *set* of genders), so a
room's internal structure is a general **compatibility graph**, not a two-sided
balance. A room of 40 mutually-incompatible people is a valid size but a dead
night. And the pool is often lopsided (the classic "too many hetero men"), so not
everyone can be placed — which forces a fairness policy for who is dropped.

## Decision

### Compatibility

Two participants are **compatible** iff each one's gender is in the other's
`interestedIn` set. This is the only relation the algorithm reasons about;
"gender balance" from the MVP is reframed as compatibility density.

### Viability rule

A Room is **viable** iff, for the target round count `R` (regime default 5),
**every placed member has at least `R` compatible others in that Room** — the
clean necessary condition for "each person can meet a distinct compatible partner
each round". Composition must produce only viable Rooms; Layer B does the actual
per-round scheduling.

### Composition procedure

1. Split the reservation pool by **age bracket** (regime default `[18–29, 30+]`,
   per-event overridable). Rooms never mix brackets.
2. Within each bracket, build Rooms sized `[floor 12 … max 60]` (target min 30)
   that satisfy the viability rule, **maximizing the number of people placed**.
3. If a bracket cannot fill even a floor-sized viable Room, its reservers are
   **deferred** to a future Event. Brackets are never merged (the age promise
   holds).

### Fairness — who is dropped when the pool is lopsided

Surplus that cannot be placed viably is dropped by **priority**:

> **consecutive drops since last placement** (descending), then
> **reservation time** (ascending).

The streak resets to 0 the moment a user is placed, so priority rotates through
the surplus and no one is left in the cold indefinitely. A **Drop / Deferral**
(for any reason — lopsided pool or thin bracket) increments the streak; a
placement resets it. Each Reservation records its outcome: `PLACED(roomId)` or
`DROPPED`.

## Alternatives considered

### Balance rooms by male/female counts

The intuitive "speed dating" model, but it collapses the moment gender is not
binary and interest is a set — a non-binary user's compatibility is bespoke.
The compatibility graph subsumes gender balance and handles everyone uniformly.

### Drop by reservation order (FIFO) or pure random

FIFO always drops the same slow-to-act users; pure random can drop the same user
many weeks running (no memory). The drop-streak counter is the minimal state that
buys cross-event equity, with reservation time as a deterministic tie-break
instead of a coin flip.

### Cumulative lifetime drop count (never resets)

Lets a frequent attendee who was occasionally unlucky permanently outrank
newcomers. Consecutive-since-placement targets the real harm — *being repeatedly
excluded* — and self-balances.

### Merge thin brackets to avoid deferral

Keeps more people playing but breaks the "similar age" promise (a 19- and a
45-year-old in one room). Preferred to shrink a Room to a floor of 12 and, failing
that, defer — protecting the promise over raw turnout.

## Consequences

- The `event` module owns the algorithm (composition is an event-lifecycle action
  writing Rooms). It runs from the reconciliation worker (ADR-0007).
- Users need drop-streak state (a counter reset on placement) and Reservations
  need an outcome field — both feed priority and the in-app "first in line next
  week" message.
- `R`, room sizes, floor, and brackets are regime defaults with per-event
  overrides (MVP §7 lists these as "tune with real data").
- Multi-room bin-packing within a bracket is an implementation concern, not a
  product decision; any partition satisfying viability + the fairness ordering is
  acceptable.
