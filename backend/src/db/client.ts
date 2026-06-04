import { createClient } from '@libsql/client'
import { config } from '../config.js'

export const db = createClient({
  url: config.tursoUrl,
  authToken: config.tursoToken,
})
