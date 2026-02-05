# Problem 3 - Messy React Analysis

## Computational inefficiencies and anti-patterns

1. `WalletBalance` misses `blockchain` even though it is used in filter/sort.
2. `getPriority` takes `any`, losing type safety and making invalid values easy to pass.
3. `lhsPriority` is referenced in filter but never defined (runtime/compile issue).
4. Filter logic is inverted: keeps `amount <= 0` instead of positive balances.
5. `useMemo` for sorted balances depends on `prices` even though prices are not used.
6. `Array.prototype.sort` comparator may return `undefined` (missing `0` branch).
7. `formattedBalances` is calculated but never used (wasted computation).
8. Rows map over `sortedBalances` but typed as `FormattedWalletBalance`.
9. `balance.formatted` is read from unformatted items (type/runtime mismatch).
10. `key={index}` is unstable and can cause reconciliation bugs.
11. `children` is destructured but never used.
12. `prices[balance.currency]` can be `undefined`, causing `NaN` USD values.

## Refactor strategy

- Add explicit blockchain typing and complete `WalletBalance` type.
- Move blockchain priorities to a module constant.
- Filter supported chains with positive amount only.
- Ensure comparator always returns a deterministic value.
- Compute formatted amount only at row render point.
- Use stable key (`blockchain:currency`) instead of index.
- Guard missing price with fallback (`?? 0`).
- Keep memo dependencies minimal and accurate.