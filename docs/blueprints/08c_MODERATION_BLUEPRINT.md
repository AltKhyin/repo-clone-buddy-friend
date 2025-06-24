[Blueprint] 08c: Moderation System (Denúncias)
Version: 1.0
Date: June 14, 2025
Purpose: This document provides the canonical blueprint for the entire content moderation system of the EVIDENS platform. It details the user-facing reporting flow and the secure administrative dashboard for reviewing and actioning reports (`Denúncias`).

================================================================================
1.0. Core Principles & User Experience
================================================================================

1.1. Feature Goal
To provide a clear, trustworthy, and efficient system for the community to report content that violates guidelines, and for administrators to review these reports and take appropriate action, thereby ensuring the health and safety of the community space.

1.2. Core User Stories
*   "As a Practitioner, when I see a comment that I believe is spam or harassment, I want to easily report it to the moderation team with a specific reason."
*   "As an Admin, I want a dedicated dashboard where I can see a queue of all pending reports, sorted by the most recent."
*   "As an Admin reviewing a report, I need to see the full context of the reported content and have a clear set of actions (e.g., Dismiss, Delete Content) to resolve the issue."

================================================================================
2.0. Visual & Interaction Blueprint
================================================================================

2.1. User-Facing Reporting Flow
*   Trigger Point: On every user-generated content item (`CommunityPost` card, individual comment), a "more options" menu (e.g., a three-dot icon) will contain a "Denunciar" (Report) action.
*   The Report Modal:
    *   Clicking "Denunciar" opens a modal (`ReportModal.js`).
    *   The modal must present a list of predefined reasons for the report (as radio buttons). This structures the data for easier review.
        *   Reasons: "Spam ou publicidade", "Assédio ou discurso de ódio", "Desinformação prejudicial", "Outro".
    *   If "Outro" is selected, a text area appears for the user to provide a custom reason.
*   Feedback: Upon successful submission, the modal closes, and a temporary toast notification appears, saying "Denúncia enviada para análise. Obrigado."

2.2. Admin-Facing Moderation Dashboard (`/admin/moderation`)
*   Layout: A master-detail, two-column layout.
*   Left Column (The Report Queue):
    *   A list of all pending reports, sorted with the newest at the top.
    *   Each item in the list (`ReportQueueItem.js`) is a card displaying:
        *   A snippet of the reported content.
        *   The reason for the report (e.g., "Spam").
        *   The reporter's username.
        *   The date of the report.
    *   Filters at the top allow viewing "Pendentes" (Pending) and "Resolvidas" (Resolved) reports.
*   Right Column (The Detail & Action Panel):
    *   When a report is selected from the queue, this panel populates with the full details.
    *   It displays the full content of the reported post/comment.
    *   It provides a "Ver no contexto" (View in Context) link that opens the specific community thread in a new tab.
    *   It contains a clear set of action buttons:
        1.  "Marcar como Resolvida" (Dismiss Report): Marks the report's status as 'Resolved' without taking action on the content.
        2.  "Deletar Conteúdo": Deletes the reported post/comment from the database and marks the report as 'Resolved'.
        3.  "Banir Usuário": A high-privilege action that changes the reported user's status to 'banned'.

================================================================================
3.0. Front-End Architecture
================================================================================

3.1. Main App Components
    Component: ReportModal.js
        Type: Module
        Props: { contentId: number, contentType: 'post' | 'comment', onClose: () => void }
        State: Manages the selected reason and custom text. Consumes `useSubmitReportMutation`.
        Responsibilities: Renders the report form and handles submission logic.

3.2. Admin App Components
    Component: ModerationPage.js
        Type: Page
        Props: ()
        State: Manages the `selectedReportId`. Consumes `useReportsQuery`.
        Responsibilities: Orchestrates the two-column layout.

    Component: ReportQueue.js
        Type: Module
        Props: { reports: Report[], onSelectReport: (id) => void }
        State: Manages the active filter ('Pending'/'Resolved').
        Responsibilities: Renders the list of `ReportQueueItem` components.

    Component: ReportDetailPanel.js
        Type: Module
        Props: { report: Report }
        State: Consumes `useActionReportMutation`.
        Responsibilities: Displays the full report details and the action buttons.

================================================================================
4.0. Backend Architecture & Data Flow
================================================================================

4.1. Database
*   Table: The `Reports` table (defined in `[DOC_3]`) is the primary table. It must contain columns for `reporter_id`, `content_type`, `content_id`, `reason`, `status`, and admin `notes`.

4.2. API Contract (Edge Functions)
*   Function: `submit-report`
    *   Auth: Required (`authenticated`).
    *   Logic: Validates the payload and inserts a new row into the `Reports` table.
*   Function: `get-reports`
    *   Auth: Required (`admin` or `editor` role).
    *   Logic: Fetches a list of reports from the `Reports` table, joining with user and content tables to provide necessary context. Takes a `status` filter parameter.
*   Function: `action-report`
    *   Auth: Required (`admin` or `editor` role).
    *   Logic: A transactional function that takes a `reportId` and an `action` type. It updates the report's status and, if necessary, performs the moderation action (e.g., deleting a row from `CommunityPosts`).

================================================================================
5.0. Implementation Checklist
================================================================================

1.  [ ] **Backend:** Create the three required Edge Functions (`submit-report`, `get-reports`, `action-report`).
2.  [ ] **Backend:** Implement the RLS policies for the `Reports` table (users can insert, admins can read/update).
3.  [ ] **Main App UI:** Build the user-facing "more options" menu and the `ReportModal.js` component.
4.  [ ] **Data Layer:** Implement the `useSubmitReportMutation` hook.
5.  [ ] **Admin App UI:** Build the `ModerationPage.js` with its two-column layout.
6.  [ ] **Admin App UI:** Build the `ReportQueue.js` and `ReportDetailPanel.js` components.
7.  [ ] **Admin Data Layer:** Implement the `useReportsQuery` and `useActionReportMutation` hooks.
8.  [ ] **Integration:** Thoroughly test the end-to-end flow from submission to resolution.


