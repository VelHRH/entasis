# Landline — MVP Specification

> The product name is **Landline**. Domains `landline.dating`, `landline.date`,
> and `landline.chat` were available as of 2026-07-04; run an EUIPO trademark
> check + app-store collision check before public launch.

## 1. Concept

Anonymous, event-based dating. No profiles to swipe, no photo-first judgments.
Users provide only **age, gender, and interested gender**. Once a week they join a
live, scheduled chat event in their city, talk to several anonymous people in short
rounds, and photos are revealed only by mutual consent at the end of the night.

**Thesis:** people are tired of doomswiping and fake photos, and many just want the
*experience of a date* back. The product sells a weekly ritual — an "80s group date
night" — not an infinite inbox.

**Positioning script:** match on Thursday → chat Friday → real date on the weekend.
The app is the bridge to the weekend, not the destination.

### Lessons from prior art (why previous blind-dating apps died)

S'More, Jigsaw, Appetence, Taffy, Twine, OKCupid Blind Date all failed on the same
traps. Every MVP mechanic below exists to counter one of them:

| Failure mode of past apps | Our counter |
|---|---|
| Late photo reveal after days of chat → painful rejection, churn | Short rounds, reveal same night, tiny sunk cost |
| Liquidity spread thin, nobody online together | Scheduled weekly event, one city at launch |
| Photo requests become pressure / early filtering returns | Double-blind mutual reveal at fixed moment only |
| Anonymity attracts minors, bots, catfish | Mandatory ID verification before entering any chat |
| Open-ended chat has no payoff moment | End-of-night results ceremony |

## 2. Core mechanics

### 2.1 The weekly event
- One event per city per week: **Thursday 20:00 local time** (weekday beats weekend:
  our target users are *out* on Fri/Sat; Thursday sets up the weekend date).
- Same slot everywhere — "Thursday night is Landline night" is the brand ritual.
  Cities run in their own local time; rooms never mix across cities.
- Verified users reserve a spot during the week. Event room opens at 20:00.
- Target room size at launch: **30–60 people**, balanced by gender/orientation
  and grouped by age brackets.

### 2.2 Rounds (digital speed dating)
- An event = **4–5 rounds** of **~10 minutes** each, 1-on-1 anonymous text chat.
- Pairing engine matches by preference (gender interest + age group), rotating so
  each round is a new partner. Icebreaker prompt shown at round start.
- Visible countdown timer per round.
- After each round, both participants privately answer:
  1. *Keep talking to this person?* (yes/no)
  2. *Reveal photos to each other?* (yes/no)
- **Nothing is revealed until the night ends.** No mid-event match notifications —
  prevents dropouts that would break later rounds for everyone else, and keeps
  every round fresh.

### 2.3 End-of-night results (the payoff moment)
- At event end, results open like envelopes:
  - Both said *keep talking* → a persistent chat unlocks.
  - Both also said *reveal* → photos appear in that chat.
  - Anything non-mutual → nothing shown. **Users see matches, never rejections.**
- Matches are not exclusive — matching with 3 of 5 partners = 3 open chats.

### 2.4 Leaving a round early
- **Leave button appears after a 2–3 min minimum** (prevents snap-judgment
  skip-culture) — except **Report**, which ends the chat instantly at any time.
- The other side sees a neutral *"This round has ended early"* — never who/why.
  The system absorbs the rejection.
- **Second-chance pool:** users whose round ended early are re-paired with each
  other for a bonus mini-round if 2+ are free. Converts the worst moment of the
  night into extra liquidity.
- Round advances early if **timer expires OR all pairs have closed** (cheap to
  build; will rarely fire at realistic room sizes — the second-chance pool is
  what actually absorbs dead time).

## 3. Verification & safety

- **Rule: no verification, no event entry.** Unverified users can sign up, browse,
  see upcoming events, join the waitlist — but cannot enter any chat. The harmful
  contact risk lives in the text chat itself, so verification cannot be deferred
  past that gate. (Also where EU/UK age-assurance law already points.)
- Natural friction placement: verify between signup and first event —
  *"Verify your identity to reserve your spot."*
- **Never store identity documents.** Use a third-party provider (Diia for Ukraine;
  Veriff / Onfido / Stripe Identity elsewhere) behind a provider interface.
  We persist only booleans: `verified_adult`, `verified_gender`.
- Verification ≠ safety: adults with bad intent pass ID checks. Day-one required:
  in-chat **report**, **block**, and **permanent ban of the verified identity**
  (a burned passport can't re-register — stronger than email bans).
- Moderation staffing is predictable: nearly all load falls in the known weekly
  event window.

## 4. Rollout strategy

- **Build for multi-region, launch in one city.** The product needs compatible
  users in the same room at the same hour — users spread across Europe = zero
  working events anywhere. Precedent: Tinder (USC), Facebook (Harvard),
  Thursday (London only).
- First city = wherever we have unfair advantage (home network, university or
  event-brand partnership, Telegram channel funnel). **First ~200 users are
  recruited by hand.** 200 committed people in one city = four sold-out events
  a month — a far smaller cold-start than a swipe app's.
- Expand city-by-city, each with a founding-event push, only after the current
  city's events fill themselves.
- When one city outgrows a room: **split within the slot** (e.g. 20–29 and 30+
  rooms, both Thursday 20:00). Never move the ritual slot.
- Architecture prep now (cheap), even though launch is single-city:
  city/region field on users and events, i18n, verification provider interface.

## 5. Technical notes (Effect TS server)

- Stack: Effect TS on Node (`@effect/platform-node`), Postgres (`@effect/sql-pg`).
  Current repo state is REST CRUD — the MVP gap is **capability, not capacity**.
- Load reality check: 15 cities × ~50 users ≈ 750 concurrent WebSockets,
  ~100 msg/sec peak, one predictable 2.5h weekly window. A single small node
  handles this at a few percent utilization. Scaling is a 100+-cities problem,
  and cities are a natural shard key (rooms never communicate cross-city).
- To build:
  - **WebSocket layer** (`@effect/platform` Socket support).
  - **Event/round state machine** — model explicitly from the start:
    - event: `scheduled → lobby → round(n) → results → closed`
    - pair: `active → ended(timer | mutual | left | reported)`
    - round-advance condition: `timer ∨ all-pairs-closed`
  - **Pairing engine**: preference-compatible rotation per round + second-chance
    pool re-pairing + odd-count / mid-event-dropout fallback.
  - **Round timers** as fibers; simultaneous double-blind reveal at event end.
  - **Verification provider interface** (Diia first, others pluggable).
  - Report/block/ban plumbing tied to verified identity.

## 6. Explicitly out of MVP scope

- Multiple cities / countries, i18n content (architecture-ready only)
- Voice messages (candidate middle rung between text and photo reveal — v2)
- Photo exchange outside the double-blind end-of-night mechanic
- Any swipe/browse/discovery surface
- Monetization
- Native apps if a PWA can carry the first city

## 7. Open questions / to tune with real data

- Round length (8–12 min sweet spot?) and rounds per event
- One combined post-round question vs. separate *keep talking* / *reveal*
- Age bracket boundaries for room composition
- Weekday: Thursday vs. Sunday evening
- First-city selection and the first-200-users channel — **the actual
  make-or-break question**, worth a dedicated week before writing more code.
