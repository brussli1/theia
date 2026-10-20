import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Two kinds of people sign in:
 *  - staff ("users" collection): admin panel users, role "admin" or "editor";
 *  - customers ("customers" collection): storefront accounts.
 * Every rule below starts from that distinction.
 */

type AnyUser = PayloadRequest['user']

export const isStaffUser = (user: AnyUser): boolean => user?.collection === 'users'

export const isAdminUser = (user: AnyUser): boolean =>
  user?.collection === 'users' && (user as { role?: string }).role === 'admin'

export const anyone: Access = () => true

export const staff: Access = ({ req: { user } }) => isStaffUser(user)

export const admins: Access = ({ req: { user } }) => isAdminUser(user)

export const staffField: FieldAccess = ({ req: { user } }) => isStaffUser(user)

export const adminField: FieldAccess = ({ req: { user } }) => isAdminUser(user)

/** Public sees published documents; staff sees drafts too. */
export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (isStaffUser(user)) return true
  return { _status: { equals: 'published' } }
}

/** Staff sees everything; a customer sees only documents linked to them. */
export const staffOrOwnCustomer: Access = ({ req: { user } }) => {
  if (isStaffUser(user)) return true
  if (user?.collection === 'customers') return { customer: { equals: user.id } }
  return false
}

/** Staff, or the signed-in customer acting on their own account. */
export const staffOrSelfCustomer: Access = ({ req: { user } }) => {
  if (isStaffUser(user)) return true
  if (user?.collection === 'customers') return { id: { equals: user.id } }
  return false
}
