// Runs the app's API client (src/api.ts) against the real server in server/,
// with a local stand-in for api.moonetix.com. Node 22 strips the types.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ApiError, EarnApi } from '../src/api.ts';

const require = createRequire(import.meta.url);
const { startServer, vectors } = require('../server/test/helpers.js');

test('app client and server together', async (t) => {
  const server = await startServer();
  t.after(() => server.close());
  const api = new EarnApi(server.base + '/');

  await t.test('signing up needs the 16+ confirmation', async () => {
    await assert.rejects(api.register('ana@example.com', 'correct horse battery', false), (err: unknown) =>
      err instanceof ApiError && err.code === 'must_be_16_or_older');
    assert.equal(api.signedIn, false);
  });

  await t.test('sign-up signs the user in with account ID 1', async () => {
    await api.register('ana@example.com', 'correct horse battery', true);
    assert.equal(api.signedIn, true);
    const me = await api.me();
    assert.equal(me.userId, '1');
    assert.equal(me.balance, '0');
  });

  await t.test('each Earn tap gets a new token for the signed-in account', async () => {
    assert.equal(await api.fetchMoonetixToken(), 'sst_test_token_1');
    await api.fetchMoonetixToken();
    assert.equal(server.moonetix.calls.length, 2);
    assert.deepEqual(server.moonetix.calls.map((c: { body: unknown }) => c.body), [{ user_id: '1' }, { user_id: '1' }]);
  });

  await t.test('a credited postback shows up as balance and history', async () => {
    await server.postback(vectors.postbacks.credit_150);
    await server.postback(vectors.postbacks.credit_decimal);
    const me = await api.me();
    assert.equal(me.balance, '150.75');
    assert.equal(me.history.length, 2);
  });

  await t.test('a server error reaches the Earn button as ApiError', async () => {
    server.moonetix.answer(403, { ok: false, error: 'app_not_live' });
    await assert.rejects(api.fetchMoonetixToken(), (err: unknown) =>
      err instanceof ApiError && err.status === 403 && err.code === 'offerwall_unavailable');
  });

  await t.test('signing out ends the session on the server too', async () => {
    await api.signOut();
    assert.equal(api.signedIn, false);
    await assert.rejects(api.me(), (err: unknown) => err instanceof ApiError && err.signedOut);
    await api.signIn('ana@example.com', 'correct horse battery');
    assert.equal((await api.me()).balance, '150.75');
  });
});
