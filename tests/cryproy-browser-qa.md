# CrypRoy browser QA — 2026-09-05

Tested with the Codex in-app Chromium browser against the local Vite app, using real UI clicks and input.

- Standalone and inline Case Study demo render with the Figma light theme, local icon assets and Inter font.
- ETH detail stays ETH through entry, review, confirmation and wallet. A 500 USDT buy costs 500.50, leaves 11,899.50 USDT and increases ETH to 1.34342264; BTC stays 0.12.
- 5 USDT fails the minimum; 12,400 USDT fails the fee-inclusive balance check. MAX is 12,387.61 and enables review.
- Confirm transitions to Processing and disables back/help/scenario controls. One completed order appears in history.
- Timeout keeps the same order reference. Check status resolves it once; history contains exactly two orders after two separate confirmations.
- BTC sale of 500 USDT credits 499.50 USDT; cash becomes 12,899.50 and BTC becomes 0.11258474.
- Searching `sol` returns Solana only. Favorite toggle and chart interval selection update. Selling unowned SOL is blocked.
- Reset restores the starting account. Demo funding, history, receipt and scope/help destinations are implemented.
- Standalone and inline widths 320, 375, 390, 768, 1024 and 1440 have no document or app horizontal overflow. After widening the inline app on mobile, its content width is 283 at a 320 viewport, with matching scroll width.
- No browser console warnings/errors or broken icon images observed in the standalone test.
- Unit tests independently check amount grammar, minimums, fee-inclusive balance, correct-coin execution, duplicate execution and sells/MAX.

Scope: sample charts/prices, in-memory balances; no external financial integration. This is interaction QA, not a usability study or complete assistive-technology audit.
