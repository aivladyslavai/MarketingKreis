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

The first implementation focus was `Phase 0 + Phase 1`. The next implemented block is `Phase 2 + Phase 3`.

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

## Phase 2

### Objective
Stop category chaos by making categories a small, fixed organization-level system.

### Requirements
1. Each organization may have at most five active marketing categories.
2. `UserCategory` is the source of truth for selectable categories.
3. Activities, calendar events, and budget targets store `category_id` links to `UserCategory`.
4. Legacy free-text category columns remain only as compatibility/display fallbacks.
5. Existing free-text categories are backfilled into the fixed set where possible.
6. Unknown or old enum category values are normalized to the configured category names.

## Phase 3

### Objective
Make entity forms predictable by using shared form primitives for repeated fields.

### Requirements
1. Category selection uses one shared `CategoryPicker`.
2. Date range entry uses one shared `DateRangePicker`.
3. Relation-like selects use a shared `RelationPicker` pattern.
4. Form sections use a common `EntityFormSection` visual frame.
5. Activity and calendar creation/editing must no longer define their own disconnected category choices.

## Out of Scope for This Phase
- Full onboarding wizard rewrite
- Full task/domain expansion beyond the CRM foundation

## Acceptance Criteria
1. Core CRM pages use `Project` as the visible business term.
2. Dashboard links open the correct CRM tab.
3. Contacts cannot be created without a company.
4. Projects cannot be created without a company.
5. Duplicate company/contact warnings appear before final submit.
6. Production-safe migration/backfill exists for old data.
7. Activities and calendar forms use the same fixed category list.
8. Category setup prevents more than five categories and deduplicates names before saving.
