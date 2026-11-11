import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const auth = readFileSync(new URL('../../src/lib/AuthContext.jsx', import.meta.url), 'utf8');
const login = readFileSync(new URL('../../src/pages/Login.jsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const gradle = readFileSync(new URL('../../android/app/build.gradle', import.meta.url), 'utf8');

test('startup attempts to restore the current session, even without an initial token snapshot', () => {
  assert.match(auth, /const checkAppState = async \(\) => \{/);
  assert.match(auth, /await checkUserAuth\(\);/);
  assert.doesNotMatch(auth, /if \(appParams\.token\)/);
});

test('startup settles both loading states and authentication completion on failure', () => {
  assert.match(auth, /finally \{\s*setIsLoadingPublicSettings\(false\)/);
  assert.match(auth, /setIsLoadingAuth\(false\)/);
  assert.match(auth, /setAuthChecked\(true\)/);
  assert.match(auth, /catch \(error\) \{[\s\S]*?checkUserAuth records the unauthenticated state/);
});

test('login verifies the authenticated account before redirecting', () => {
  assert.match(login, /await base44\.auth\.loginViaEmailPassword\(email, password\)/);
  assert.match(login, /const account = await checkUserAuth\(\)/);
  assert.ok(login.indexOf('const account = await checkUserAuth()') < login.indexOf('window.location.assign(returnTo)'));
});

test('app avoids a redirect side effect in React render', () => {
  assert.doesNotMatch(app, /navigateToLogin\(\);/);
});

test('APK version moves forward while retaining independent test package', () => {
  assert.match(gradle, /versionCode 20261033/);
  assert.match(gradle, /applicationIdSuffix "\.scrolltest"/);
});
