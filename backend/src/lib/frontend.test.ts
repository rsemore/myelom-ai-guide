import assert from 'node:assert/strict'
import { test } from 'node:test'
import Fastify from 'fastify'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { registerFrontend } from './frontend'

test('serves built frontend routes without masking API, docs or asset errors', async t => {
  const root = await mkdtemp(join(tmpdir(), 'wigymtrio-frontend-'))
  const app = Fastify()
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true })
  })
  await mkdir(join(root, 'assets'))
  await writeFile(join(root, 'index.html'), '<!doctype html><title>WigymTrio</title>')
  await writeFile(join(root, 'assets', 'app.js'), 'console.log("app")')
  app.get('/api/example', () => ({ ok: true }))
  app.get('/docs/json', () => ({ openapi: '3.0.3' }))
  await registerFrontend(app, root)

  for (const url of ['/', '/history', '/sources/guide.md', '/doctor/registration']) {
    const response = await app.inject({ url, headers: { accept: 'text/html' } })
    assert.equal(response.statusCode, 200, url)
    assert.match(response.headers['content-type'] ?? '', /text\/html/)
    assert.match(response.body, /WigymTrio/)
  }
  const asset = await app.inject('/assets/app.js')
  assert.equal(asset.statusCode, 200)
  assert.match(asset.body, /console.log/)
  assert.deepEqual((await app.inject('/api/example')).json(), { ok: true })
  assert.deepEqual((await app.inject('/docs/json')).json(), { openapi: '3.0.3' })

  for (const url of ['/api/missing', '/api', '/docs/missing', '/assets/missing.js']) {
    const response = await app.inject({ url, headers: { accept: 'text/html' } })
    assert.equal(response.statusCode, 404, url)
    assert.equal(response.json().error, 'Not Found')
  }
  assert.equal((await app.inject('/unknown')).statusCode, 404)
  assert.equal((await app.inject({
    method: 'POST', url: '/history', headers: { accept: 'text/html' }
  })).statusCode, 404)
  assert.equal((await app.inject({
    method: 'HEAD', url: '/history', headers: { accept: 'text/html' }
  })).statusCode, 200)
})

test('fails explicitly if the configured frontend build does not exist', async () => {
  const app = Fastify()
  try {
    await assert.rejects(registerFrontend(app, '/nonexistent/wigymtrio-frontend'), /ENOENT/)
  } finally {
    await app.close()
  }
})
