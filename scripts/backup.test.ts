import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// backup.cjs is a CommonJS Admin-SDK script. Load it through createRequire so
// we get its raw module.exports. Its firebase-admin / service-account requires
// are deferred into runBackup(), and runBackup() only runs when the file is
// invoked directly, so importing it here has no side effects and needs no key.
const requireCjs = createRequire(import.meta.url);
const { backupSubcollections, countUserDataDocs, finalizeBackup } = requireCjs('./backup.cjs');

// Minimal in-memory stand-in for the slice of the Admin SDK that
// backupSubcollections touches. It exposes listDocuments() (NOT a collection
// .get()) so a regression back to the old .get()-based enumeration — which
// silently skips missing parent docs — would throw here and fail the test.
interface FakeSnap {
  size: number;
  forEach: (cb: (doc: { id: string; data: () => unknown }) => void) => void;
}
interface FakeDocRef {
  id: string;
  get: () => Promise<{ exists: boolean; data: () => unknown }>;
  collection: (name: string) => { get: () => Promise<FakeSnap> };
}
interface FakeDb {
  collection: (name: string) => {
    listDocuments?: () => Promise<FakeDocRef[]>;
    get?: () => Promise<never>;
  };
}

function makeSubcollectionOnlyDb(): FakeDb {
  const workoutDoc = { id: 'workout', data: () => ({ sessions: [], version: 4 }) };
  const emptySnap: FakeSnap = { size: 0, forEach: () => {} };
  const dataSnap: FakeSnap = { size: 1, forEach: (cb) => cb(workoutDoc) };

  // users/{uid} parent has NO own fields → a Firestore "missing document".
  const userRef: FakeDocRef = {
    id: 'user-abc',
    get: async () => ({ exists: false, data: () => undefined }),
    collection: (name) => ({ get: async () => (name === 'data' ? dataSnap : emptySnap) }),
  };

  return {
    collection: (name) => {
      if (name === 'users') {
        return {
          listDocuments: async () => [userRef],
          get: async () => {
            throw new Error('backup must enumerate via listDocuments(), not collection.get()');
          },
        };
      }
      throw new Error(`unexpected collection: ${name}`);
    },
  };
}

describe('backupSubcollections', () => {
  it('captures a subcollection-only parent (missing users/{uid} doc) via listDocuments', async () => {
    const db = makeSubcollectionOnlyDb();
    const result = await backupSubcollections(db, 'users', ['data']);

    // The missing parent must still be enumerated and its data/* captured.
    expect(Object.keys(result)).toContain('user-abc');
    expect(result['user-abc']._subcollections.data).toBeDefined();
    expect(result['user-abc']._subcollections.data.workout).toEqual({ sessions: [], version: 4 });

    // A missing parent has no own fields → captured as {}, never undefined.
    expect(result['user-abc']._data).toEqual({});
  });

  it('counts a subcollection-only backup as non-empty', async () => {
    const db = makeSubcollectionOnlyDb();
    const result = await backupSubcollections(db, 'users', ['data']);

    const { parents, docs } = countUserDataDocs(result);
    expect(parents).toBe(1);
    expect(docs).toBeGreaterThan(0);
  });

  it('reports zero data docs for a user with no subcollections (empty-backup guard)', () => {
    const emptyUsers = { 'user-x': { _data: {}, _subcollections: {} } };
    const { parents, docs } = countUserDataDocs(emptyUsers);
    expect(parents).toBe(1);
    expect(docs).toBe(0);
  });
});

describe('finalizeBackup — quarantine empty backups', () => {
  it('keeps a plain .json when the backup has documents', () => {
    const dir = mkdtempSync(join(tmpdir(), 'temple-backup-'));
    const file = join(dir, '20260101_000000_backup.json');
    writeFileSync(file, '{}', 'utf-8');

    const res = finalizeBackup(file, 3);

    expect(res).toEqual({ path: file, valid: true });
    expect(existsSync(file)).toBe(true);
    expect(existsSync(`${file}.INVALID`)).toBe(false);

    rmSync(dir, { recursive: true, force: true });
  });

  it('quarantines a zero-doc backup to .INVALID (no plain .json is left behind)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'temple-backup-'));
    const file = join(dir, '20260101_000000_backup.json');
    writeFileSync(file, '{}', 'utf-8');

    const res = finalizeBackup(file, 0);

    expect(res).toEqual({ path: `${file}.INVALID`, valid: false });
    // The trustworthy-looking plain .json is gone; only the quarantined
    // artifact remains for inspection.
    expect(existsSync(file)).toBe(false);
    expect(existsSync(`${file}.INVALID`)).toBe(true);

    rmSync(dir, { recursive: true, force: true });
  });
});
