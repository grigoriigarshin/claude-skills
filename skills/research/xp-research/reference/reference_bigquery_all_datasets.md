---
name: BigQuery — all accessible projects and datasets
description: Full map of BigQuery projects and datasets accessible to Grigorii, with descriptions of what each contains
type: reference
---

## Accessible BigQuery projects

Confirmed via `bq ls --projects` on 2026-04-27.

| Project | Notes |
|---|---|
| `fulfillment-dwh-production` | Main DH data warehouse — primary source for all analytics |
| `logistics-data-storage-staging` | Logistics analytics project — rider, delivery, chat data |
| `logistics-service-staging` | Logistics staging infra — no queryable datasets accessible |
| `dh-ai-project` | DH AI project |
| `dhub-data-commune` | Data commune — no queryable datasets accessible |
| `dhub-infra-prod-platform` | Infra platform |
| `mkt-adcatalog-tagger` / `mkt-adcatalog-tagger-stage` | Marketing ad catalog |
| `subs---knowledge-base-tr-6112` | Knowledge base |

---

## `fulfillment-dwh-production` datasets

### Core data (primary analytics)

| Dataset | What's inside |
|---|---|
| `curated_data_shared_coredata_business` | **Main analytics dataset**: `orders` (raw, partitioned by `partition_date_local`), `agg_orders_daily` (aggregated by date+entity+dimensions), `vendors`, `ratings`, `incentives`, `incentive_transactions`, `products`, `subscription_events` |
| `curated_data_shared_coredata` | Reference/lookup tables: `global_entities` (brand, country, entity metadata, `is_reporting_enabled`), `fx_rates`, `dates`, holidays |
| `curated_data_shared_coredata_tracking` | User tracking and session data (Perseus) |

### Brand-specific datasets

| Dataset | What's inside |
|---|---|
| `curated_data_shared_glovo` | Glovo-specific tables |
| `curated_data_shared_peya` | PedidosYa-specific tables |
| `curated_data_shared_woowa_korea` | Woowa/Baemin Korea-specific tables |

### Domain datasets

| Dataset | What's inside |
|---|---|
| `curated_data_shared_cx` | Customer experience: NPS surveys (after order, relational, churn), rider NPS, vendor NPS, brand pulse |
| `curated_data_shared_gfs` | Ghost kitchens / GFS: kitchen orders, vendors, kitchen OKRs, Talabat kitchen data |
| `curated_data_shared_dmart` | Q-commerce darkstore ops: inventory, pickers, purchase orders, stock, product availability, SKU data, supplier data |
| `curated_data_shared_vendor` | Vendor-specific analytics |
| `curated_data_shared_mkt` | Marketing analytics |
| `curated_data_shared_fintech` | Fintech/wallet: P2P transfers (financial, not chat), payment data |
| `curated_data_shared_cdp` | Customer data platform |
| `curated_data_shared_experimentation` | A/B test assignment tables (Eppo output) |
| `curated_data_shared_perseus_tracking` | Perseus web/app tracking events |
| `curated_data_shared_intl_markets` | International markets reporting |
| `curated_data_shared_sre` | SRE / reliability metrics |
| `curated_data_shared_adtech` | Ad tech data |
| `curated_data_shared_consumer_dwh` | Consumer data warehouse |
| `curated_data_shared_gdp` | Global delivery platform data |
| `curated_data_shared_gds` | Global delivery services |
| `curated_data_shared_gis` | Global information systems |
| `curated_data_shared_govops` | Government/ops data |
| `curated_data_shared_paa` | PAA domain operations |
| `curated_data_shared_psf` | PSF domain |
| `curated_data_shared_central_dwh` | Central data warehouse |
| `curated_data_shared_coda` | CODA data |
| `curated_data_shared_coda_datamart` | CODA datamart |
| `curated_data_shared_datahub_services` | Datahub services |
| `curated_data_shared_media_service` | Media service data |
| `curated_data_shared_sales_revenue` | Sales and revenue data |

### Event streams

| Dataset | What's inside |
|---|---|
| `curated_data_shared_data_stream` | Raw event streams: `order_stream`, `order_status_stream`, `delivery_stream`, `delivery_status_stream`, `payment_stream`, `vendor_stream`, `customer_event_stream`, `rider_earning_stream`, `message_delivery_receipt_stream` (SMS/email receipts — NOT P2P chat), and many more |
| `curated_data_shared_data_stream_perseus` | Perseus-specific data stream events |

---

## `logistics-data-storage-staging` datasets

### Key analytics datasets

| Dataset | What's inside |
|---|---|
| `delivery_flow` | **`_rider_chats_extended`**: rider→support agent chats during delivery, with `order_id`, `contact_reason_l3`, `delivery_status_on_contact`, `final_delivery_status`, `message_history`. Partitioned by `created_date`, clustered by `global_entity_id`. NOTE: these are rider-to-agent chats, NOT P2P customer↔rider chat |
| `dashboards_service` | Service dashboard tables |
| `dashboards_customer` | Customer dashboard tables |
| `dashboards_rider` | Rider dashboard tables |
| `dashboards_rider_workforce` | Rider workforce dashboards |
| `rider_analytics` | Rider analytics |
| `rider_experience` | Rider experience metrics |
| `rider_management` | Rider management data |
| `rider_availability` | Rider availability data |
| `long_term_ops_service` | Long-term operational analytics: service |
| `long_term_ops_customer` | Long-term operational analytics: customer |
| `long_term_ops_rider` | Long-term operational analytics: rider |
| `pickup_and_dropoff` | P&D (pickup and dropoff) metrics |
| `on_the_way` | On-the-way delivery stage metrics |
| `order_acceptance` | Order acceptance analytics |
| `quality_logs` | Delivery quality logs |
| `choice_analytics` | Choice/selection analytics |
| `log_optimisation` | Logistics optimisation |
| `logistics_competition_benchmarking` | Competitive benchmarking |
| `dps_optimization` | DPS (delivery promise service) optimization |
| `eppo_output` / `eppo_abba_output` | Experimentation (Eppo) results |
| `mobile_infra` | Mobile infrastructure data |

### Personal sandbox datasets
~100 datasets named after individuals (e.g. `sandbox_alexey`). Personal workspaces for logistics analysts — not reliable for production queries.

---

## What is NOT in BigQuery

- `logistics-service-staging` — accessible project but no queryable datasets

## P2P chat data location

`fulfillment-dwh-production.curated_data_shared.p2p_chats` — customer↔rider direct chat. View became accessible 2026-04-27. See dedicated memory file for schema and join tips.

---

## Key query tips

- `fulfillment-dwh-production.curated_data_shared_coredata_business.orders` requires `partition_date_local` filter or query will fail
- `fulfillment-dwh-production.curated_data_shared_coredata_business.agg_orders_daily` — prefer for historical queries; filter on `placed_date_local`
- Always join `global_entities` and filter `is_reporting_enabled IS TRUE` for cross-brand analysis
- `logistics-data-storage-staging.delivery_flow._rider_chats_extended` partitioned by `created_date`
