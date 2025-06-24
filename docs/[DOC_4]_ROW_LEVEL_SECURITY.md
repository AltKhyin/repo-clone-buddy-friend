# **\[DOC\_4\] Row Level Security (RLS) Policies**

Version: 1.0  
Date: June 14, 2025  
Purpose: This document defines the canonical and complete set of Row Level Security (RLS) policies for the EVIDENS database. It is the single source of truth for all data access authorization. RLS moves security logic into the database layer, ensuring that data is protected regardless of how it is accessed. The AI developer must implement these policies precisely as specified.

## **1.0 Core Principles**

* **PRINCIPLE 1 (Default Deny):** All tables will have RLS enabled. By default, no user (anonymous or authenticated) can access any data. Access is only granted via the explicit CREATE POLICY statements defined in this document.  
* **PRINCIPLE 2 (Supabase Auth Integration):** Policies will heavily utilize functions from Supabase's auth schema to identify the current user and their properties. The key functions are:  
  * auth.uid(): Returns the UUID of the currently authenticated user.  
  * auth.role(): Returns the role of the authenticated user (e.g., authenticated, anon).  
* **PRINCIPLE 3 (Custom Claims):** Our application uses custom JWT claims (role, subscription\_tier). We will create a helper function to access these claims cleanly within our policies.  
* **PRINCIPLE 4 (Admin Bypass):** Users with the administrative role of 'admin' or 'editor' will often bypass standard user-facing restrictions. This logic is built directly into the policies.

## **2.0 Custom Helper Function**

To simplify policy definitions, we will first create a custom function to safely extract claims from the user's JWT.

**RULE:** This function must be created in the database before any policies that depend on it are created.

\-- Helper function to safely get a value from the user's JWT claims.  
CREATE OR REPLACE FUNCTION get\_my\_claim(claim TEXT) RETURNS TEXT AS $$  
  SELECT nullif(current\_setting('request.jwt.claims', true)::jsonb \-\>\> claim, '')::TEXT;  
$$ LANGUAGE sql STABLE;

## **3.0 Table Policy Definitions**

For each table, RLS must be enabled first: ALTER TABLE "TableName" ENABLE ROW LEVEL SECURITY;

### **3.1 Practitioners Table**

* **Purpose:** To ensure users can only view and edit their own personal information. Admins can view all profiles.

| Action | Target User Tier(s) | Condition | Notes |
| :---- | :---- | :---- | :---- |
| SELECT | All Authenticated, Admin | User's id matches auth.uid(), OR user role is admin. | Users see their own profile. Admins see all. |
| UPDATE | All Authenticated | User's id matches auth.uid(). | Users can only update their own profile. |

\-- 1\. Enable RLS  
ALTER TABLE "Practitioners" ENABLE ROW LEVEL SECURITY;

\-- 2\. SELECT Policy  
CREATE POLICY "Practitioners can view their own profile, and admins can view all."  
ON "Practitioners" FOR SELECT  
USING (  
  (auth.uid() \= practitioner\_id) OR (get\_my\_claim('role') \= 'admin')  
);

\-- 3\. UPDATE Policy  
CREATE POLICY "Practitioners can update their own profile."  
ON "Practitioners" FOR UPDATE  
USING (  
  auth.uid() \= practitioner\_id  
)  
WITH CHECK (  
  auth.uid() \= practitioner\_id  
);

### **3.2 Reviews Table**

* **Purpose:** The core of our content gating. To control visibility of reviews based on the user's subscription tier and the review's access level.

| Action | Target User Tier(s) | Condition |
| :---- | :---- | :---- |
| SELECT | All Tiers (Unauth, Free, Paying) | The policy checks a hierarchy of permissions. Unauthenticated users see 'public'. Free users see 'public' and 'free\_users\_only'. Paying users and Admins see everything ('public', 'free\_users\_only', 'paying\_users\_only'). |
| INSERT | Admin Roles (author, editor) | The user's role must be 'author' or 'editor'. |
| UPDATE | Admin Roles (author, editor) | The user must be the original author OR have the 'editor' role. |
| DELETE | Admin Roles (editor) | Only 'editor' or higher can delete. |

\-- 1\. Enable RLS  
ALTER TABLE "Reviews" ENABLE ROW LEVEL SECURITY;

\-- 2\. SELECT Policy (Complex)  
CREATE POLICY "Reviews are visible based on user subscription tier."  
ON "Reviews" FOR SELECT  
USING (  
  (access\_level \= 'public') OR  
  (  
    auth.role() \= 'authenticated' AND access\_level \= 'free\_users\_only'  
  ) OR  
  (  
    auth.role() \= 'authenticated' AND  
    get\_my\_claim('subscription\_tier') \= 'paying' AND  
    access\_level \= 'paying\_users\_only'  
  ) OR  
  (  
    get\_my\_claim('role') IN ('editor', 'admin')  
  )  
);

\-- 3\. INSERT Policy  
CREATE POLICY "Authors and editors can create reviews."  
ON "Reviews" FOR INSERT  
WITH CHECK (  
  get\_my\_claim('role') IN ('author', 'editor', 'admin')  
);

\-- 4\. UPDATE Policy  
CREATE POLICY "Authors can update their own reviews; editors can update any."  
ON "Reviews" FOR UPDATE  
USING (  
  (auth.uid() \= author\_id AND get\_my\_claim('role') \= 'author') OR  
  (get\_my\_claim('role') IN ('editor', 'admin'))  
)  
WITH CHECK (  
  (auth.uid() \= author\_id AND get\_my\_claim('role') \= 'author') OR  
  (get\_my\_claim('role') IN ('editor', 'admin'))  
);

\-- 5\. DELETE Policy  
CREATE POLICY "Editors and admins can delete reviews."  
ON "Reviews" FOR DELETE  
USING (  
  get\_my\_claim('role') IN ('editor', 'admin')  
);

### **3.3 CommunityPosts Table**

* **Purpose:** To allow open reading of posts but restrict writing and modification to the content owner.

| Action | Target User Tier(s) | Condition |
| :---- | :---- | :---- |
| SELECT | All Tiers | All posts are publicly readable (true). |
| INSERT | All Authenticated | The author\_id of the new post must match the current user's ID. |
| UPDATE | Authenticated Owner | The user must be the author of the post (author\_id \= auth.uid()). |
| DELETE | Authenticated Owner, Admin | The user must be the author OR have an admin/editor role. |

\-- 1\. Enable RLS  
ALTER TABLE "CommunityPosts" ENABLE ROW LEVEL SECURITY;

\-- 2\. SELECT Policy  
CREATE POLICY "All users can view community posts."  
ON "CommunityPosts" FOR SELECT  
USING (true);

\-- 3\. INSERT Policy  
CREATE POLICY "Authenticated users can create posts."  
ON "CommunityPosts" FOR INSERT  
WITH CHECK (  
  auth.role() \= 'authenticated' AND author\_id \= auth.uid()  
);

\-- 4\. UPDATE Policy  
CREATE POLICY "Users can update their own posts."  
ON "CommunityPosts" FOR UPDATE  
USING (  
  auth.uid() \= author\_id  
)  
WITH CHECK (  
  auth.uid() \= author\_id  
);

\-- 5\. DELETE Policy  
CREATE POLICY "Users can delete their own posts; admins can delete any."  
ON "CommunityPosts" FOR DELETE  
USING (  
  (auth.uid() \= author\_id) OR  
  (get\_my\_claim('role') IN ('editor', 'admin'))  
);

### **3.4 Reports Table**

* **Purpose:** To allow authenticated users to submit reports, but only allow admins to view them.

| Action | Target User Tier(s) | Condition |
| :---- | :---- | :---- |
| SELECT | Admin Roles | User's role must be 'editor' or 'admin'. |
| INSERT | All Authenticated | The reporter\_id must match the user's ID. |

\-- 1\. Enable RLS  
ALTER TABLE "Reports" ENABLE ROW LEVEL SECURITY;

\-- 2\. SELECT Policy  
CREATE POLICY "Admins and editors can view reports."  
ON "Reports" FOR SELECT  
USING (  
  get\_my\_claim('role') IN ('editor', 'admin')  
);

\-- 3\. INSERT Policy  
CREATE POLICY "Authenticated users can submit reports."  
ON "Reports" FOR INSERT  
WITH CHECK (  
  auth.role() \= 'authenticated' AND reporter\_id \= auth.uid()  
);

## **4.0 Storage Policies**

* **PRINCIPLE:** Supabase Storage buckets will also be protected by RLS-like policies.  
* **Implementation:** Policies will be written in SQL within the Supabase dashboard's Storage section.  
* **Example Policy (Profile Pictures):** A policy will be created for the avatars bucket that only allows a user to INSERT or UPDATE a file if the file path matches their own user ID.  
  * Example Path: avatars/00000000-0000-0000-0000-000000000000.png  
  * Policy Condition: (bucket\_id \= 'avatars' AND (storage.foldername(name))\[1\] \= auth.uid()::text)