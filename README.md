# Demo Diner: loyalty app
A small React Native loyalty app built with Expo and TypeScript. A member can view their points and tier, browse offers, redeem one, and show a single-use barcode at the venue.

## Overview
- **Home:** member card with name, tier, points and progress to the next tier, plus All / Available / Redeemed / Expired filters.
- **Offer detail:** full offer info, terms and a pinned Redeem action with confirmation before generating a short-lived code.
- **Redeem:** single-use Code 128 barcode, readable fallback code and 15-minute countdown.
- **Mock API:** 600–1400 ms simulated latency, configurable failures and persisted redemptions across app restarts.
- **Core states:** loading, empty, partial failure, full failure, retry, redeeming, failed redemption, expired and already redeemed.
- **Stretch goals:** deep linking, distinct redeemed/expired states, pull to refresh and accessibility support.

**Design:** [Figma file, view only](https://www.figma.com/design/NzG8Rv3AwbOsMwSJB0Fywm)  
I mocked the main screens and states before implementation so the flow and expected behaviour were defined before I started building.

## Getting started
Requires Node 20+. Runs in Expo Go, so no native build is required.

```bash
npm install
npx expo start
npm test
npm run typecheck
npm run lint
```

Then press `i` for iOS, `a` for Android, or scan the QR code with Expo Go.

## Demo tools
Tap the avatar in the top-right of Home, or the **Demo tools** link at the bottom.

- Change the simulated failure rate: Off / 20% / 50% / Always.
- Reset redeemed offers so the redeem flow can be tested again.

These controls only exist in the mock implementation and are separate from the `LoyaltyApi` contract.

```bash
EXPO_PUBLIC_MOCK_FAILURE_RATE=1 npx expo start
npx uri-scheme open "exp://127.0.0.1:8081/--/offers/loaded-fries" --ios
```

Development build deep link: `demodiner://offers/loaded-fries`

## Key decisions
```text
src/
  app/          Expo Router routes
  screens/      Home, OfferDetail, RedemptionCode
  components/   Presentational UI
  data/         TanStack Query hooks and query client config
  domain/       Offer status, sorting and formatting rules
  api/          LoyaltyApi interface, mock implementation and typed errors
```

- **Server state lives in TanStack Query.** Loading, error, retry, refetch and cache behaviour are handled there, so there is no Redux or Zustand store.
- **The API is behind a `LoyaltyApi` interface.** Screens never import the mock directly, so a real HTTP client could replace it without changing the UI.
- **Member and offers are separate queries.** If offers fail, the member card can still render instead of turning the whole screen into an error state.
- **Errors are typed.** Only retryable failures are automatically retried.
- **Offer status is derived from dates rather than stored.** This avoids duplicated state and lets an offer expire while the app is open without a refetch.
- **Redeeming is never auto-retried.** Each attempt gets an idempotency key reused for manual retries. If the server redeems successfully but the response is lost, retrying with the same key returns the original redemption instead of consuming the offer again.
- **Persistence uses AsyncStorage only in the mock server.** A redeemed offer and its code survive an app restart without introducing a heavier persistence layer.
- **Successful redemptions update the TanStack Query cache directly.** Home and detail update immediately without another request. I did not use an optimistic update because the barcode does not exist until the server generates the code.
- **Barcode rendering uses `jsbarcode` + `react-native-svg`.** I chose these over a dedicated React Native barcode wrapper because the wrapper options I reviewed appeared inactive, while the underlying dependencies are actively maintained.

## Testing
I focused on behaviour that would be costly or confusing if it failed rather than aiming for a coverage percentage.

Tests cover:
- redemption rules and persistence
- idempotent retries and lost responses
- configurable API failures
- offer status and expiry boundaries
- barcode encoding
- error → retry recovery
- successful redemption through to barcode
- deep links to expired and unknown offers

The core flow and failure states were also manually tested in the iOS simulator.

## Accessibility
Screen-reader labels and roles, VoiceOver error announcements, 44pt minimum touch targets, Dynamic Type support and WCAG AA text contrast are included. Some colours were darkened slightly from my first draft to meet contrast requirements.

## Trade-offs and next steps
For the scope of this task I left out authentication/multiple members, offline query-cache persistence, push/real-time cross-device updates, E2E tests, dark mode and Apple/Google Wallet passes.

With more time, I would add offline query persistence, connectivity awareness, analytics around the redemption funnel and E2E coverage.

## AI tools
I used Claude Code for this task. I defined the product flow and UI states, created the Figma mock-up, chose the overall approach and dependencies, and used Claude Code to scaffold the project and generate most of the implementation and tests.

I reviewed the generated code and behaviour against the brief, manually exercised the core flow and edge cases, and ran the test, typecheck and lint suites before submission.

Architecture and dependency choices including TanStack Query, AsyncStorage, barcode rendering and redemption idempotency were discussed with the AI and decided by me.

## Notes
Expo SDK 57 · React 19 · React Native 0.86 · React Compiler enabled
