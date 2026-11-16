import test from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import { databaseUrlFromEnv, normaliseDatabaseUrl, databasePoolConfig, databaseFailureReason } from '../api/_lib/database-config.js'

const url = 'postgresql://test_role:dummy%40password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

test('the pasted production error is repaired without changing credentials', () => {
  const pasted = url.replace('?sslmode=', ' sslmode=') + '\n'
  const fixed = normaliseDatabaseUrl(pasted)
  assert.equal(fixed.pathname, '/neondb')
  assert.equal(fixed.searchParams.get('sslmode'), 'require')
  assert.equal(fixed.searchParams.get('channel_binding'), 'require')
  assert.equal(fixed.password, 'dummy%40password')
  const client = new pg.Client(databasePoolConfig(pasted))
  assert.equal(client.connectionParameters.database, 'neondb')
  assert.equal(client.connectionParameters.host, 'ep-example.us-east-2.aws.neon.tech')
  assert(client.connectionParameters.ssl)
  assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false)
  assert(client.enableChannelBinding)
})

test('valid URLs, quotes and copied psql wrappers preserve the intended database', () => {
  for (const value of [url, ` \n${url}\r\n`, `'${url}'`, `"${url}"`, `psql '${url}'`]) {
    const fixed = normaliseDatabaseUrl(value)
    assert.equal(fixed.pathname, '/neondb')
    assert.equal(fixed.password, 'dummy%40password')
  }
})

test('an explicitly encoded space in a real database name is never reinterpreted as options', () => {
  const fixed = normaliseDatabaseUrl('postgresql://test:dummy@localhost/a%20sslmode=require')
  assert.equal(fixed.pathname, '/a%20sslmode=require')
  assert.equal(fixed.search, '')
})

test('environment aliases ignore blank values and preserve precedence', () => {
  assert.equal(databaseUrlFromEnv({ DATABASE_URL: ' \n', POSTGRES_URL: url }), url)
  assert.equal(databaseUrlFromEnv({ DATABASE_URL: url, NEON_DATABASE_URL: 'different' }), url)
  assert.equal(databaseUrlFromEnv({ NEON_DATABASE_URL: url }), url)
  assert.equal(databaseUrlFromEnv({}), '')
})

test('hosted connections keep certificate verification; localhost can use plain Postgres', () => {
  const hosted = databasePoolConfig(url)
  assert.equal(new URL(hosted.connectionString).searchParams.get('sslmode'), 'verify-full')
  assert.equal(hosted.ssl.rejectUnauthorized, true)
  const local = databasePoolConfig('postgresql://test:dummy@127.0.0.1/dev')
  assert.equal(local.ssl, false)
})

test('bad settings and driver failures return useful messages without secrets', () => {
  for (const value of ['not-a-postgres-url-dummy-secret', 'https://console.neon.tech/', 'postgresql://test:dummy@localhost/']) {
    assert.throws(() => normaliseDatabaseUrl(value), error => !error.message.includes('dummy-secret') && /Postgres|database setting/.test(error.message))
  }
  for (const code of ['3D000', '28P01', 'ECONNREFUSED', 'CERT_HAS_EXPIRED', undefined]) {
    const reason = databaseFailureReason({ code, message: `Connection failed for ${url}` })
    assert(!reason.includes('dummy') && !reason.includes('test_role') && !reason.includes('ep-example'))
  }
})
