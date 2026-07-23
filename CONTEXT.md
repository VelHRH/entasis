# Entasis — Ubiquitous Language

Glossary of domain terms. Definitions only — no implementation details.
See `MVP.md` for the full product specification.

## Terms

### Regime
A mode of dating the app offers — the ruleset that governs how an Event is run
and how its Rooms are composed. The launch regime is **speed blind dating** (the
weekly anonymous short-round night described in `MVP.md`). Future regimes (e.g.
group dating, interests dating) are anticipated but not built; every Event
declares its Regime so later regimes are additive.

### Profile
The dating-facing facts a User provides at registration: date of birth, gender,
the set of genders they are interested in, and their city (plus, for large
cities, a finer area). Deliberately minimal — no photo, no bio, no interests.
A completed, verified Profile in a city is that User's **standing intent** to
participate in that city's Events; it is the demand signal an admin reads when
deciding to create an Event.

### Reservation
A User's explicit commitment to attend one specific Event ("I'll be there this
Thursday"). Distinct from standing intent: standing intent (having a Profile)
says *wants*, a Reservation says *will come*. The set of Reservations for an
Event is the input population to room composition.

### Cutoff
The moment an Event stops accepting Reservations and composes its Rooms from the
reservation pool. Room composition runs automatically at the Cutoff.

### City
A place the app operates in or gauges demand for. Reference data (seeded from an
external source), carrying at least a name, country, and timezone. A Profile
belongs to a City; an Event is scoped to one City. The City's timezone defines
the Event's local start (the weekly 20:00).

### Event
A scheduled night in **one City** on **one date**, run under a **Regime** (the
weekly ritual, e.g. "Kyiv, Thursday 2026-07-16, speed blind dating"). One
Thursday across three cities is three Events. An Event contains many **Rooms**
and has no participants of its own — people participate through a Room, and only
after a **Reservation** places them into one at the **Cutoff**.

### Room
A group of participants spending the event night together (target 30–60 people,
composed within a single **age bracket**, sized to be internally *matchable* —
everyone has enough compatible partners for the night's Rounds). Belongs to an
Event and inherits its City. Rounds and Chats happen inside a Room. Rooms are
built by composition at the Cutoff, not joined manually.

### Age bracket
A contiguous age range (e.g. 18–29, 30+) used to group people into Rooms; a Room
never mixes brackets. Bracket boundaries are a Regime default, overridable per
Event.

### Compatibility
Two participants are compatible when each one's gender is in the other's set of
interested genders. The primitive the composition algorithm runs on: a Room is
viable only if every member has enough compatible others in it to fill the
night's Rounds.

### Drop / Deferral
A Reservation not placed into a Room at the Cutoff (because the pool was lopsided
or too thin). Deferred users roll to a future Event and gain priority: placement
favours those with the longest run of consecutive drops since their last
placement, reservation time breaking ties.

### Chat
A 1-on-1 dialog between two members of the same Room. In the target product a
Chat is created by the pairing engine for a **Round** (and persists after the
night only on mutual "keep talking"). The manual pick-a-partner prototype is
being retired as Rooms move under Events.

### Message
A single text utterance inside a Chat, authored by one participant.

### Round (future)
A timed (~10 min) slice of an Event night during which every participant is
paired into exactly one 1-on-1 anonymous Chat. An Event night has 4–5 Rounds.

### Match (future)
The mutual outcome of a Round: both participants privately answered "keep
talking". Non-mutual outcomes are never shown to either side.

### Reveal (future)
The double-blind photo exchange at the end of the night: photos appear only if
both participants opted in, and only inside a Match's persistent Chat.

### Session
A logged-in user's authentication context (cookie for web, bearer token for
mobile). Not a domain concept of the dating night — purely account access.

## Open questions

- *(resolved)* Event is **city-scoped**: an Event belongs to one City and one
  date; the same Thursday in two cities is two Events, each opening at its own
  local 20:00 and composing its own Rooms. Rooms carry age bracket, not city.
