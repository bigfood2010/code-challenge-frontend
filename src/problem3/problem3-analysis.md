# Problem 3 - Messy React Analysis

## Computational inefficiencies and anti-patterns

1. `WalletBalance` misses `blockchain` even though it is used in filter/sort.
2. `getPriority` takes `any`, losing type safety and allowing invalid values.
3. `lhsPriority` is referenced in filter but never defined (runtime/compile break).
4. Filter logic is inverted: it keeps `amount <= 0` instead of positive balances.
5. `useMemo` for sorted balances depends on `prices` even though prices are not used.
6. `Array.prototype.sort` comparator may return `undefined` (missing `0` branch).
7. `.sort()` mutates arrays in place; here it sorts the new array returned by `filter`, so it is safe, but copy-first style is clearer.
8. `formattedBalances` is calculated but never used (wasted computation).
9. Rows map over `sortedBalances` but typed as `FormattedWalletBalance` (type mismatch).
10. `balance.formatted` is read from unformatted items (runtime mismatch).
11. `key={index}` is unstable and can cause reconciliation bugs.
12. `children` is destructured but never used.
13. `prices[balance.currency]` can be `undefined`, causing `NaN` USD values.
14. `getPriority` is recreated on every render because it is declared inside the component.
15. `getPriority` is called repeatedly in filter/sort instead of being precomputed once per item.


## Refactor strategy

- Add explicit `blockchain` typing and keep unsupported chains safely handled.
- Move chain priorities to a module-level constant.
- Filter to supported chains with positive balances only.
- Sort with a deterministic numeric comparator (`-1 | 0 | 1` equivalent).
- Avoid in-place side effects by sorting a copied array.
- Format amount at render time to avoid duplicate transformations.
- Use a stable key (`blockchain:currency`) instead of index.
- Guard missing prices with fallback (`?? 0`) to avoid `NaN`.
- Keep hook dependency arrays minimal and accurate.
- Move `getPriority` outside the component and reduce repeated priority lookups during sorting/filtering.
