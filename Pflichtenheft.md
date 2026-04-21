# Pflichtenheft

## Product Goal
MarketingKreis must behave like a coherent operating system for customer and marketing work, not like a set of disconnected tables and pages.

## Scope of the Agreed Foundation
This repository now follows the approved base model:
- `Company`
- `Contact`
- `Project`
- `Activity`
- `Event`
- `Task`

The first implementation focus is `Phase 0 + Phase 1`.

## Phase 0

### Objective
Create one stable product vocabulary across UI, API, and documentation.

### Requirements
1. Add a canonical domain document to the repo.
2. Use `Project` as the user-facing term instead of `Deal`.
3. Keep backward compatibility for existing deal-based integrations and routes.
4. Remove the most confusing deal/project label mismatches from the core CRM and dashboard experience.

## Phase 1

### Objective
Enforce basic relational integrity for CRM data and prevent the most common duplicate errors.

### Requirements
1. `organization_id` must be present for core CRM rows.
2. A `Contact` must always belong to a `Company`.
3. A `Project` must always belong to a `Company`.
4. A `Project` linked to a contact must stay consistent with that contact's company.
5. Calendar events linked to a project must stay consistent with the selected company.
6. Duplicate prevention must exist for:
   - companies by normalized name
   - companies by email when present
   - contacts by email when present
7. UI must call a duplicate-check endpoint before or during submit and warn the user early.
8. Existing production data must be backfilled safely before hard constraints are applied.

## Backfill Strategy
1. Normalize CRM strings and emails.
2. Create an `Unknown Company` placeholder per organization when required.
3. Reassign orphan contacts/projects to a valid company.
4. Merge duplicate companies before unique constraints are added.
5. Merge duplicate contacts before unique constraints are added.

## Compatibility Strategy
- Keep legacy `deal` routes working.
- Add `project` aliases for new UI work.
- Keep the current storage table during this phase to avoid a risky physical rename.

## Out of Scope for This Phase
- Category-system refactor
- Shared entity form framework
- Full onboarding wizard rewrite
- Full task/domain expansion beyond the CRM foundation

## Acceptance Criteria
1. Core CRM pages use `Project` as the visible business term.
2. Dashboard links open the correct CRM tab.
3. Contacts cannot be created without a company.
4. Projects cannot be created without a company.
5. Duplicate company/contact warnings appear before final submit.
6. Production-safe migration/backfill exists for old data.
