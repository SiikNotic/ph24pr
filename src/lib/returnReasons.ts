import type { ReturnReason } from '@/types/domain'

// The reasons offered for a failed delivery / return going forward.
// 'customer_unavailable' and 'expired' are legacy enum values kept only so
// old records still render correctly — no longer offered when creating a
// new one.
export const RETURN_REASONS: ReturnReason[] = ['no_response', 'refused', 'damaged', 'wrong_address', 'access_denied', 'other']
