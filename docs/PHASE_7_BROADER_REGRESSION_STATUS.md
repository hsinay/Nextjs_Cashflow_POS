# Phase 7 Broader Regression Status

**Date:** 2026-04-03  
**Status:** Partial Coverage Achieved

## Automated Coverage Completed

- Payment allocation model integrity
- Customer outstanding-balance integrity
- Purchase-order allocation integrity
- Currency default and persisted payment currency consistency
- Runtime scan for:
  - hardcoded `USD` defaults
  - hardcoded `DollarSign` usage
  - recursive `formatCurrency` pattern

## Manual Coverage Still Needed

- POS credit sale with zero upfront payment
- POS credit sale with partial upfront payment
- POS fully paid customer sale
- Customer Orders page date and balance display
- Record Payment dialog interaction
- Customer payment edit/delete/refund browser flow
- Supplier payment link/unlink/update/delete/refund browser flow
- Payment detail pages and report screens in live UI

## Current Confidence

- Data model correctness: high
- Runtime financial consistency: high
- Currency consistency: high
- Browser-flow regression confidence: medium until manual UI pass is completed
