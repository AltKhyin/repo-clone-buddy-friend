# **\[Blueprint\] 01: Authentication & Onboarding**

Version: 1.0  
Date: June 14, 2025  
Purpose: This document is the canonical, feature-specific blueprint for the entire user identity, authentication, access control, and onboarding flow of the EVIDENS platform. It provides a complete specification—from UI to database—for how users are created, authenticated, and granted access. The AI developer must reference this document for all tasks related to user identity.

## **1.0 Core Principles & User Experience**

### **1.1 Feature Goal**

To provide a secure, seamless, and trustworthy identity system that correctly segments users into their respective access tiers and provides a welcoming, context-gathering onboarding experience.

### **1.2 Core User Stories**

* **Story 1.1:** As a new user, I want to create an account using my email and a password so that I can access the platform's features.  
* **Story 9.1:** As an Admin, I want to edit a specific Review, set its access level to "Public," and share the link with a non-registered colleague, allowing them to view this single piece of content freely.  
* **Story 9.2:** As a Free User, when I try to access a Review intended for paying users, I want to be seamlessly redirected to the sign-up or subscription page.  
* **Onboarding Story:** As a new Practitioner, after my first login, I want to be guided through a brief questionnaire to personalize my experience and help the platform understand my needs.

### **1.3 The Four User Tiers (Authorization Context)**

This is the fundamental access control model for the entire platform.

| Tier Name | Authentication Status | Key Identifier(s) | Core Permission |
| :---- | :---- | :---- | :---- |
| **Unauthenticated** | Not Logged In | auth.role() \= 'anon' | Can only view content where access\_level \= 'public'. |
| **Free User** | Logged In | auth.role() \= 'authenticated', subscription\_tier \= 'free' | Can view 'public' and 'free\_users\_only' content. |
| **Paying User** | Logged In | auth.role() \= 'authenticated', subscription\_tier \= 'paying' | Can view all user-facing content. |
| **Admin Roles** | Logged In | role IN ('admin', 'editor') | Bypasses all content access restrictions for management purposes. |

## **2.0 Visual & Interaction Blueprint**

This section defines the look, feel, and flow of all screens related to authentication.

### **2.1 Login Page (/login)**

* **Visual Specification:**  
  * **Layout:** A single, centered card on a clean, light-themed background. The EVIDENS brand logotype is prominent.  
  * **Key Components:**  
    * Email Input: Standard input field.  
    * Password Input: Standard password field.  
    * Sign In Button: Primary call-to-action button.  
    * Forgot Password Link: Secondary action link.  
    * Register Link: Tertiary link navigating to the /signup page.  
  * **Styling:** Must strictly adhere to \[DOC\_7\]\_VISUAL\_SYSTEM.md. The overall aesthetic should match image\_2d205a.png.  
* **Interaction Flow:**  
  1. User enters credentials and clicks "Sign In".  
  2. UI enters a loading state (button disabled, spinner shown).  
  3. A call is made to the Supabase Auth client (supabase.auth.signInWithPassword).  
  4. **On Success:** The user session is created. The application redirects to the / (Homepage). If it is the user's *very first login*, the OnboardingWizard modal is presented over the homepage.  
  5. **On Error (e.g., invalid credentials):** A clear, non-technical error message is displayed near the form (e.g., "Email ou senha inválidos."). The UI returns to an interactive state.

### **2.2 Signup Page (/signup)**

* **Visual Specification:**  
  * Identical layout and aesthetic to the Login page, but with additional fields.  
  * **Key Components:** Full Name Input, Email Input, Password Input, Confirm Password Input, Sign Up Button, Login Link.  
* **Interaction Flow:**  
  1. User fills the form and clicks "Sign Up".  
  2. Client-side validation checks if passwords match.  
  3. UI enters a loading state.  
  4. A call is made to the Supabase Auth client (supabase.auth.signUp).  
  5. **On Success:** Supabase sends a confirmation email. The UI displays a success message instructing the user to check their email to verify their account.  
  6. **On Error (e.g., email already in use):** An error message is displayed (e.g., "Este email já está em uso.").

### **2.3 Onboarding Questionnaire**

* **Visual Specification:**  
  * **Layout:** A multi-step modal overlay (OnboardingWizard.js) that appears after the user's first successful login.  
  * **Key Components:** Progress indicator (e.g., "Step 1 of 4"), question text, answer inputs (multiple choice or text area), "Next" and "Back" buttons.  
  * **Styling:** The modal should be clean, focused, and adhere to \[DOC\_7\].  
* **Interaction Flow:**  
  1. The OnboardingWizard fetches questions from the API.  
  2. User proceeds through the steps, answering each question.  
  3. On the final step, clicking "Finish" submits all answers to the backend.  
  4. The modal closes, revealing the full homepage UI. The user is not shown this wizard again on subsequent logins.

## **3.0 Front-End Architecture**

### **3.1 Component Breakdown**

| Component Name | Type | Props Contract | State Management | Responsibilities |
| :---- | :---- | :---- | :---- | :---- |
| AuthLayout.js | Layout | { children: ReactNode } | None | Provides the consistent centered card layout for /login and /signup. |
| LoginForm.js | Module | () | Manages form input state, loading state, error state. | Renders the login form, handles user input, and calls the useLoginMutation hook on submit. |
| SignupForm.js | Module | () | Manages form input state, loading state, error state. | Renders the signup form, handles validation, and calls the useSignupMutation hook. |
| OnboardingWizard.js | Module | () | Manages current step, answers state, loading state. | Fetches questions via useOnboardingQuestionsQuery, presents steps, and submits answers via useSubmitAnswersMutation. |
| ProtectedRoute.js | HOC/Wrapper | { children: ReactNode } | Subscribes to auth state. | A wrapper component that checks for an active user session. If no session exists, it redirects to /login. |

### **3.2 State Management & Data Flow**

* **Session Management:** The global application state will be managed by a simple store (e.g., Zustand) that subscribes to Supabase's onAuthStateChange listener. This store will provide the current session and practitioner profile to the entire application.  
* **Data Hooks:**  
  * useLoginMutation: Encapsulates the supabase.auth.signInWithPassword call.  
  * useSignupMutation: Encapsulates the supabase.auth.signUp call.  
  * useOnboardingQuestionsQuery: Fetches the onboarding questions.  
  * useSubmitAnswersMutation: Submits the onboarding answers.  
  * **RULE:** All hooks must adhere to the patterns in \[DOC\_6\]\_DATA\_FETCHING\_STRATEGY.md.

## **4.0 Backend Architecture & Data Flow**

### **4.1 Authentication Provider**

* **Provider:** Supabase Auth is the sole and exclusive authentication provider.  
* **Configuration:** Email/password authentication will be enabled, with secure email confirmation required.

### **4.2 Custom Claims Trigger**

* **Mechanism:** A PostgreSQL function will be created and configured to run as a trigger AFTER INSERT ON auth.users.  
* **Name:** public.handle\_new\_user()  
* **Logic:**  
  1. This function is triggered automatically when Supabase Auth creates a new user in its internal auth.users table.  
  2. It copies the user's ID and email into our public Practitioners table.  
  3. It sets the default role ('practitioner') and subscription\_tier ('free') for the new user.  
  4. It sets these same values as custom claims within the user's JWT metadata using raw\_app\_meta\_data. This is critical for the RLS policies to function correctly.

### **4.3 Relevant Database Tables & RLS**

* **Tables Involved:** Practitioners, Onboarding\_Questions, Onboarding\_Answers.  
* **RLS Policies:** The policies defined in \[DOC\_4\]\_ROW\_LEVEL\_SECURITY.md for the Practitioners table are the primary security mechanism for this feature. They ensure users can only view and edit their own profiles.

## **5.0 Implementation Checklist**

### **Backend & Database (Foundation First)**

* \[ \] **Task 1.1:** Create DB migration for Onboarding\_Questions and Onboarding\_Answers tables.  
* \[ \] **Task 1.2:** Create the public.handle\_new\_user() PostgreSQL trigger function.  
* \[ \] **Task 1.3:** Configure the trigger in the Supabase dashboard to fire on new user creation.  
* \[ \] **Task 1.4:** Implement the Admin UI for managing onboarding questions (this is part of a later blueprint, but the backend support is foundational).  
* \[ \] **Task 1.5:** Implement the API endpoints for fetching questions and submitting answers.

### **Frontend (Main Application)**

* \[ \] **Task 2.1:** Build the AuthLayout.js component.  
* \[ \] **Task 2.2:** Build the LoginForm.js and SignupForm.js components and their corresponding data hooks (useLoginMutation, etc.).  
* \[ \] **Task 2.3:** Wire up the /login and /signup pages.  
* \[ \] **Task 2.4:** Implement the global auth state listener (onAuthStateChange).  
* \[ \] **Task 2.5:** Build the OnboardingWizard.js component and its data hooks.  
* \[ \] **Task 2.6:** Implement the logic to display the OnboardingWizard only on the user's first login.  
* \[ \] **Task 2.7:** Implement the ProtectedRoute.js wrapper and apply it to all necessary pages/layouts.