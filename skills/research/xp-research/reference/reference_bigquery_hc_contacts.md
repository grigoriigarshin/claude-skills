---
name: BigQuery — Help Center contacts
description: How to find Help Center contacts in BigQuery, including the right table, filter, and brand join
type: reference
originSessionId: 40e47cdd-b2e5-4b6b-b9aa-ccfbe9246f7a
---
## Table

`fulfillment-dwh-production.curated_data_shared.all_contacts`

Also available enriched: `fulfillment-dwh-production.curated_data_shared.all_contacts_enriched`

## Filter for Help Center contacts

```sql
WHERE stakeholder_entry_point LIKE 'Help Center%'
```

Entry point sub-types:
- `Help Center - Customer` — largest volume (~6.6M/30d globally)
- `Help Center - Rider`
- `Help Center - Vendor Portal`
- `Help Center - Godroid`
- `Help Center - Pelican`
- `Help Center - Vendor ODR`

## Join to get brand names

```sql
JOIN `fulfillment-dwh-production.curated_data_shared_coredata.global_entities` ge
  ON c.global_entity_id = ge.global_entity_id
WHERE ge.is_reporting_enabled IS TRUE
```

Column for brand name: `ge.brand_name`

Note: the `curated_data_shared_central_dwh.global_entities` view appears empty — use `curated_data_shared_coredata.global_entities` instead.

## Date column

Use `created_date` (DATE type) for time filtering:
```sql
WHERE created_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
```

## Key columns

| Column | Type | Notes |
|---|---|---|
| `contact_id` | STRING | Unique contact identifier |
| `global_entity_id` | STRING | Join key to global_entities |
| `stakeholder_entry_point` | STRING | Filter `LIKE 'Help Center%'` for HC |
| `channel` | STRING | Chat, Form, Email, Call |
| `contact_reason_l1/l2/l3` | STRING | Contact reason hierarchy |
| `inbound_contact_ind` | INT64 | 1 = inbound |
| `wastage_contact_ind` | INT64 | 1 = wastage |
| `csat_score` | INT64 | CSAT rating |
| `created_date` | DATE | Use for time filters |
