# Entasis — Ubiquitous Language

Glossary of domain terms. Definitions only — no implementation details.
See `MVP.md` for the full product specification.

## Terms

### Event
A scheduled night attached to a **date** (the weekly ritual, e.g. "Thursday
2026-07-16"). An Event contains many **Rooms**. An Event has no participants of
its own — people participate through a Room.

### Room
A group of participants spending the event night together (target 30–60 people,
composed by city / age bracket / orientation balance). Belongs to an Event.
Rounds and Chats happen inside a Room.

*Current state:* Rooms exist standalone (no Event entity yet) as joinable
named containers. The Event → Room hierarchy is agreed but not yet built.

### Chat
A 1-on-1 dialog between two members of the same Room. Today it is opened
manually by picking a partner; in the target product a Chat is created by the
pairing engine for a **Round** (and persists after the night only on mutual
"keep talking").

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

- Event is date-only while Rooms carry the city: one calendar Event spans all
  cities, each Room opening at its own local 20:00. Confirm this reading with a
  concrete scenario (Kyiv room and Berlin room on the same Thursday Event).
