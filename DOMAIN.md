# Domain Model

## Purpose
This document defines the core product vocabulary for MarketingKreis. It is the single source of truth for how CRM, calendar, activities, onboarding, and future workflow features relate to each other.

## Core Entities

### Company
- A legal entity or client account.
- Always belongs to exactly one `Organization`.
- Can have many `Contact`s.
- Can have many `Project`s.

Required rules:
- `organization_id` is required.
- Company names are unique within an organization after normalization.

### Contact
- A real person.
- Always belongs to exactly one `Company`.
- Always belongs to the same `Organization` as its company.

Required rules:
- `company_id` is required.
- If an email exists, it must be unique within the organization.

### Project
- A longer-running business or marketing initiative.
- Product term: `Project`.
- Current technical compatibility layer: stored in the legacy `deals` table.
- May be linked to one `Company`.
- May be linked to one primary `Contact`.

Examples:
- `Website Relaunch 2026`
- `Employer Branding Q2`
- `Newsletter Automation Rollout`

Required rules:
- A project must belong to one organization.
- A project must belong to one company.
- If a contact is selected, that contact must belong to the same company.

### Activity
- A block of marketing work inside a project or organization context.
- Represents a thematic workstream, not a specific timeslot.
- Uses a fixed `ActivityType`.
- Must use one of the organization's fixed marketing categories.

Examples:
- `Spring Campaign Planning`
- `Sales Enablement Sprint`

### Event
- A concrete date/time entry in the calendar.
- Represents when something happens.
- May reference a `Project`, `Company`, `Activity`, or content item.
- If both project and company are present, they must be consistent.
- May use one of the organization's fixed marketing categories.

Examples:
- `Kickoff meeting`
- `Launch date`
- `Deadline for asset delivery`

### Task
- A personal unit of work assigned to a user.
- Smaller than a project, more concrete than an activity.
- May optionally relate to project/activity/contact context.

Examples:
- `Prepare proposal deck by Friday`
- `Call sponsor contact`

## Hierarchy
- `Project`: why we are doing something.
- `Activity`: what block of work we are doing.
- `Event`: when something happens.
- `Task`: what one person needs to do.

## Naming Policy
- User-facing UI should use `Project`, not `Deal`.
- Backend compatibility may still expose legacy `deal` names while migration is in progress.
- New API/UI work should prefer `project` naming and keep backward compatibility only where needed.

## Integrity Rules
- Every CRM row must belong to an organization.
- Every contact must belong to a company.
- Project/contact/company relations must stay graph-consistent.
- Each organization has at most five active marketing categories.
- Activities, calendar events, and budget targets link to `UserCategory` through `category_id`; legacy category text is kept only for compatibility and display fallback.
- Duplicate prevention starts with:
  - Company normalized name uniqueness per organization
  - Company email uniqueness per organization when present
  - Contact email uniqueness per organization when present

## Compatibility Notes
- The `deals` table remains the storage layer for projects for now.
- `/crm/deals` stays available for backward compatibility.
- `/crm/projects` is the preferred compatibility-safe product-facing alias.
- Legacy enum-like category values such as `VERKAUFSFOERDERUNG` are normalized to the configured category names.
