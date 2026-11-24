# CREOVATE Firestore Security Specification (Phase 0)

## 1. Data Invariants

1. **Identity & Privilege Invariant**: Users can only create `/users/{uid}` for their own `request.auth.uid`, with `role` restricted to `'brand'` or `'creator'` (never self-assigned `'admin'`, except the bootstrapped admin email with `email_verified == true`), and `status == 'active'`.
2. **PII Isolation Invariant**: `/users/{uid}` contains email PII and is strictly readable only by `isOwner(uid)` or `isAdmin()`. Public directory records (`brandProfiles`, `creatorProfiles`) exclude private email/phone PII.
3. **Master Gate Invariant**: Messages in `/conversations/{conversationId}/messages/{messageId}` require parent conversation existence and participant membership (`brandId == uid || creatorId == uid`) verified via `get()`.
4. **Terminal State Locking Invariant**: Once a `campaign` reaches `'completed'` or `'cancelled'`, a `collaborationRequest` reaches `'accepted'`, `'rejected'`, or `'withdrawn'`, a `collaboration` reaches `'completed'` or `'cancelled'`, or a `deliverable` reaches `'approved'`, non-admin updates are strictly rejected.
5. **Temporal Integrity Invariant**: All `createdAt` fields must equal `request.time` on create and remain immutable on update. All `updatedAt` fields must equal `request.time` on create and update.
6. **Bounded Arrays & Path Hardening Invariant**: Every document ID on single-document operations passes `isValidId()`, every string enforces `.size()` limits matching `firebase-blueprint.json`, and every array enforces bounded `.size()` and first-element type checks.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Self-Assigned Admin Escalation**: Creating `/users/attacker` with `{ role: "admin", status: "active" }` as a non-admin.
2. **Shadow Field Injection**: Creating a `creatorProfiles` doc with an extra ghost field `{ isVerifiedAdmin: true }`.
3. **Email Spoofing Without Verification**: Accessing admin routes with `email: "jagtaptanishka0604@gmail.com"` when `email_verified: false`.
4. **PII Cross-User Read**: Authenticated user B attempting `get` on `/users/userA`.
5. **Client-Side Timestamp Forgery**: Creating a campaign with `createdAt: Timestamp(2020-01-01)` instead of `serverTimestamp()`.
6. **ID Poisoning Attack**: Creating a document with a 200-character or special-character document ID (`../admin`).
7. **State Shortcutting on Request**: Brand attempting to self-accept a brand-initiated invitation (`initiatorRole: "brand"` -> `status: "accepted"`).
8. **Terminal State Mutation**: Attempting to revert a `'completed'` collaboration back to `'active'` as a non-admin.
9. **Unauthorized Message Injection**: Non-participant user C writing into `/conversations/conv1/messages/msg1`.
10. **Owner Hijack on Update**: Updating a campaign's `brandId` to another user's UID.
11. **Value Poisoning on Allowed Key**: Updating `deliverables/{id}.status` to a 500KB string or boolean.
12. **Unfiltered Scraping of Private Collections**: Running an unfiltered `list` query on `/notifications` or `/conversations` expecting other users' records.
