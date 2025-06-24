[Blueprint] 09: Analytics Dashboard
Version: 1.0
Date: June 14, 2025
Purpose: This document provides the canonical blueprint for the Analytics Dashboard within the EVIDENS Admin Application. It details the data pipeline, API contracts, and component architecture required to build a performant and insightful analytics experience.

================================================================================
1.0. Core Principles & Architecture
================================================================================

1.1. Feature Goal
To provide the EVIDENS team with a comprehensive and performant dashboard to monitor key platform metrics related to user engagement, content performance, community health, and system performance.

1.2. Architectural Mandate: No Direct Queries
*   RULE: The Analytics Dashboard front-end MUST NOT query the main application tables (`Practitioners`, `Reviews`, `CommunityPosts`, etc.) directly.
*   RATIONALE: Performing complex analytical queries on live production tables is inefficient and can degrade application performance.
*   IMPLEMENTATION: All dashboard components MUST fetch their data from a set of pre-aggregated `Summary_*` tables, which are populated by a background process.

================================================================================
2.0. The Analytics Data Pipeline
================================================================================

This blueprint depends on the three-stage analytics pipeline defined in `[DOC_2]`.

1.  **Stage 1: Ingestion (Event Logging)**
    *   The Main App front-end will be instrumented to call a high-throughput Edge Function (`log-event`) for key user actions (e.g., `review_viewed`, `user_registered`, `post_created`).
    *   This function performs a fast, simple insert into a raw `Analytics_Events` table.
2.  **Stage 2: Aggregation (ETL)**
    *   A scheduled Supabase Cron Job (`run-analytics-etl`) runs periodically (e.g., hourly).
    *   This job reads the raw events from `Analytics_Events`, aggregates them, and populates a series of summary tables.
3.  **Stage 3: Serving**
    *   The Admin App dashboard reads exclusively from the summary tables.

================================================================================
3.0. Visual & Interaction Blueprint (`/admin/analytics`)
================================================================================

3.1. Dashboard Layout
*   Global Controls: A header bar with a date range picker and a toggle to "Exclude admin data."
*   KPI Cards: A row of high-level statistic cards at the top.
*   Tabbed Interface: A set of tabs ("Engajamento," "Conteúdo," etc.) that switch between different views of charts and metrics.

3.2. Chart & Component Breakdown
*   `KPICard.js`: A simple card displaying a title, a large number, and a trend indicator.
*   `LineChart.js`, `BarChart.js`, `PieChart.js`: Reusable chart components built with a library like Recharts. They take data and configuration as props.
*   `DataTable.js`: A simple table component for displaying ranked lists like "Páginas Mais Visitadas."

3.3. The "Playground" Feature
*   This is a UI for building custom reports.
*   It consists of a form with dropdowns to select:
    1.  Chart Type (Line, Bar)
    2.  Metric (Y-Axis) (e.g., 'User Registrations', 'Review Views')
    3.  Dimension (X-Axis) (e.g., 'Date')
    4.  Filters (e.g., 'Review ID')
*   Submitting the form generates a new chart in the main area.

================================================================================
4.0. Backend & Data Flow
================================================================================

4.1. Database: Summary Tables
*   The `run-analytics-etl` cron job must populate tables like:
    *   `Summary_Daily_Activity`: Pre-calculates DAUs, new user counts, etc., for each day.
    *   `Summary_Content_Performance`: Pre-calculates total views, comments, etc., for each `Review`.
    *   `Summary_Page_Views`: Pre-calculates view counts for each major URL path.

4.2. API Contract
*   Function: `get-analytics-dashboard-data`
    *   Auth: Required (`admin` role).
    *   Logic: Takes `start_date` and `end_date` as parameters. It performs a series of fast `SELECT` queries against the various `Summary_*` tables and returns a single, consolidated JSON object with all the data needed for the default dashboard views.
*   Function: `get-custom-analytics-query`
    *   Auth: Required (`admin` role).
    *   Logic: Takes the configuration from the Playground form, dynamically constructs a safe query against the summary tables, and returns the data for the custom chart.

================================================================================
5.0. Implementation Checklist
================================================================================

1.  [ ] **Backend (Pipeline):** Create the `Analytics_Events` table and all necessary `Summary_*` tables.
2.  [ ] **Backend (Pipeline):** Implement the `log-event` ingestion Edge Function.
3.  [ ] **Backend (Pipeline):** Implement the `run-analytics-etl` scheduled cron job.
4.  [ ] **Main App:** Instrument the front-end to call `log-event` for all key user actions.
5.  [ ] **Backend (API):** Implement the `get-analytics-dashboard-data` and `get-custom-analytics-query` Edge Functions.
6.  [ ] **Admin UI:** Build the main dashboard layout with its global controls and tabbed interface.
7.  [ ] **Admin UI:** Build the reusable chart and KPI components.
8.  [ ] **Admin UI:** Assemble the default dashboard views by wiring up the components to the `useAnalyticsDashboardQuery` data hook.
9.  [ ] **Admin UI (Playground):** Build the `AnalyticsPlayground.js` form and the logic to render custom charts from its output.


