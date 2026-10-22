import type { Payload } from 'payload'

/**
 * Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD when the
 * panel has no users yet. After that, admins are managed from the panel.
 */
export async function bootstrapAdmin(payload: Payload): Promise<void> {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return
  try {
    const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
    if (totalDocs > 0) return
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email, password, name: 'Administrador', role: 'admin' },
    })
    payload.logger.info(`Created first admin user ${email}`)
  } catch (err) {
    // The tables may not exist yet on the very first boot of a migration run.
    payload.logger.warn({ err }, 'Could not bootstrap the admin user')
  }
}
