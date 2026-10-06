# Telegram topics and checkout

- [x] New-topic navigation, first-message naming, silent rename and paired lazy two-hour cleanup implemented; native Telegram link/event behavior still needs a real-client check.
- [x] Use the app's opening assistant message in the bot from shared copy.
- [x] Show all saved addresses and add in-bot shipping selection; isolated tests passed with eight addresses and express shipping.
- [x] Preserve owner-validated address and shipping in Mini App payment; app build and function checks passed, both functions deployed. Frontend requires publishing; real Telegram end-to-end check remains unverified.

# Desktop chat polish

- [x] Align all desktop assistant messages, loading states, product and checkout blocks on one left rail.
- [x] Center single-line input text and placeholder; preserve multiline growth.
- [x] Replace cart title area with a clean, stroke-based header across desktop stores.
- [x] Verify desktop rendering and mobile isolation. No mobile files changed; existing project lint errors remain outside this scope.