const CONNECTION_KEYS = ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL']

export function databaseUrlFromEnv(env = process.env) {
  return CONNECTION_KEYS.map(key => String(env[key] || '').trim()).find(Boolean) || ''
}

/** Parse pasted connection values as data; never execute a copied psql command. */
export function normaliseDatabaseUrl(raw) {
  let value = String(raw || '').trim()
  const command = value.match(/^psql\s+(['"])(postgres(?:ql)?:\/\/[\s\S]+)\1$/i)
  if (command) value = command[2]
  else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1).trim()

  // A known copy/paste mistake: /neondb sslmode=require&channel_binding=require.
  // Repair only literal whitespace before these SSL parameters. An explicitly
  // encoded space in a legitimate database name must retain its meaning.
  const pasted = value.match(/^(postgres(?:ql)?:\/\/[^\s?#]+\/[^\s/?#]+)\s+((?:sslmode|channel_binding)=[^\s?#]+)$/i)
  if (pasted) {
    const params = new URLSearchParams(pasted[2])
    if ([...params.keys()].every(key => ['sslmode', 'channel_binding'].includes(key))) value = `${pasted[1]}?${pasted[2]}`
  }

  let url
  try { url = new URL(value) } catch { throw new Error('Use the Postgres connection URL from Neon’s Connect dialog, not a Neon API key. It must start with postgresql://.') }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
    throw new Error('The database setting must be a Postgres connection URL with a hostname and database name.')
  }
  if (/\s/.test(value)) throw new Error('The Postgres connection URL contains unexpected whitespace. Copy the connection URL again from Neon’s Connect dialog.')
  return url
}

export function databasePoolConfig(raw) {
  const url = normaliseDatabaseUrl(raw)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  // Public hosted databases use normal certificate and hostname verification.
  // The current pg driver treats "require" as verify-full; make that explicit
  // so a future driver update cannot quietly weaken the existing verification.
  if (!local && (!url.searchParams.has('sslmode') || url.searchParams.get('sslmode') === 'require')) url.searchParams.set('sslmode', 'verify-full')
  return {
    connectionString: url.href,
    ssl: local ? false : { rejectUnauthorized: true },
    enableChannelBinding: url.searchParams.get('channel_binding') !== 'disable',
  }
}

/** Health checks must not echo a URL, password or raw driver error. */
export function databaseFailureReason(error) {
  if (['3D000', '3F000'].includes(error?.code)) return 'The database name is incorrect. Copy the Postgres connection URL from Neon’s Connect dialog; SSL options must follow a ? after the database name.'
  if (['28P01', '28000'].includes(error?.code)) return 'The database credentials were rejected. Update the Postgres connection URL in Vercel and redeploy.'
  if (['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(error?.code)) return 'The database could not be reached. Check the connection hostname and that the Neon endpoint is available.'
  if (/^Use the Postgres connection URL|^The database setting must|^The Postgres connection URL contains/.test(error?.message || '')) return error.message
  if (/certificate|ssl|tls/i.test(`${error?.code || ''} ${error?.message || ''}`)) return 'The database TLS connection could not be verified. Check the connection settings and certificate configuration.'
  return 'The database connection failed. Check the Postgres connection URL in Vercel, then redeploy and refresh Setup.'
}
