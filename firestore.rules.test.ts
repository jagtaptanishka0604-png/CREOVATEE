/**
 * CREOVATE Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Validates that adversarial payloads violate our Eight Pillars invariants.
 */

export interface AdversarialCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
  reason: string;
}

export const dirtyDozenCases: AdversarialCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Admin Escalation',
    collectionPath: '/users/attacker_uid',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'attacker_uid', name: 'Mallory', email: 'm@example.com', role: 'admin', status: 'active', onboardingComplete: false },
    reason: 'Non-admin cannot create a user document with role=admin.',
  },
  {
    id: 2,
    name: 'Shadow Field Injection',
    collectionPath: '/creatorProfiles/creator_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'creator_1', fullName: 'Test', username: 'test', ghostField: true },
    reason: 'hasOnly() rejects undeclared shadow keys.',
  },
  {
    id: 3,
    name: 'Unverified Email Admin Spoof',
    collectionPath: '/adminActions/act_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { adminId: 'spoof', adminEmail: 'jagtaptanishka0604@gmail.com', actionType: 'ban', targetType: 'user', targetId: 'u1', details: 'x' },
    reason: 'isAdmin() requires request.auth.token.email_verified == true.',
  },
  {
    id: 4,
    name: 'Cross-User PII Read',
    collectionPath: '/users/victim_uid',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    reason: 'PII user documents are restricted to isOwner() or isAdmin().',
  },
  {
    id: 5,
    name: 'Client Timestamp Forgery',
    collectionPath: '/campaigns/camp_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
    reason: 'createdAt and updatedAt must strictly match request.time.',
  },
  {
    id: 6,
    name: 'Document ID Poisoning',
    collectionPath: '/campaigns/invalid..id$$$',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    reason: 'isValidId() enforces ^[a-zA-Z0-9_\\-]+$ and size <= 128.',
  },
  {
    id: 7,
    name: 'Invitation Self-Acceptance',
    collectionPath: '/collaborationRequests/req_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'accepted' },
    reason: 'Only the recipient (creator for brand-initiated invite) may accept.',
  },
  {
    id: 8,
    name: 'Terminal State Reversal',
    collectionPath: '/collaborations/collab_completed',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'active' },
    reason: 'Completed collaborations are locked from non-admin mutations.',
  },
  {
    id: 9,
    name: 'Unauthorized Conversation Message Injection',
    collectionPath: '/conversations/conv_1/messages/msg_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { senderId: 'outsider', body: 'spam' },
    reason: 'Master Gate checks parent conversation brandId/creatorId membership.',
  },
  {
    id: 10,
    name: 'Owner Hijack on Update',
    collectionPath: '/campaigns/camp_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { brandId: 'other_brand_uid' },
    reason: 'Immortal owner fields are excluded from affectedKeys().hasOnly() and checked immutable.',
  },
  {
    id: 11,
    name: 'Value Poisoning on Allowed Key',
    collectionPath: '/deliverables/del_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: true },
    reason: 'isValidDeliverable() wraps all updates and enforces enum/string constraints.',
  },
  {
    id: 12,
    name: 'Unscoped Private Notification Scraping',
    collectionPath: '/notifications',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    reason: 'allow list explicitly requires resource.data.recipientId == request.auth.uid || isAdmin().',
  },
];
