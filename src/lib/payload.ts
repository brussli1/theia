import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

export function getPayloadClient(): Promise<Payload> {
  return getPayload({ config: configPromise })
}
