/**
 * Firestore Backup Script
 *
 * Exports all user data from Firestore to a timestamped JSON file.
 * Usage: node scripts/backup.cjs
 *
 * Backups are saved to: backups/YYYYMMDD_HHmmss_backup.json
 *
 * ENUMERATION NOTE: all real user data lives under the
 * `users/{uid}/data/*` subcollections; the `users/{uid}` PARENT docs carry no
 * own fields and are therefore Firestore "missing documents". A
 * `collection('users').get()` does NOT return missing docs, so it captures
 * nothing. We enumerate with `listDocuments()` (Admin SDK only), which returns
 * a DocumentReference for every parent — including missing ones — so the
 * per-user subcollections are actually backed up.
 */

const fs = require('fs');
const path = require('path');

async function backupCollection(db, collectionName) {
    console.log(`  📦 Backing up collection: ${collectionName}`);
    const snapshot = await db.collection(collectionName).get();
    const data = {};
    snapshot.forEach((doc) => {
        data[doc.id] = doc.data();
    });
    console.log(`     → ${snapshot.size} documents`);
    return data;
}

async function backupSubcollections(db, collectionName, subcollectionNames) {
    console.log(`  📦 Backing up collection with subcollections: ${collectionName}`);
    // listDocuments() returns refs for every parent doc, INCLUDING missing ones
    // (parents with no own fields but with populated subcollections). A plain
    // .get() would skip those and silently back up nothing — the original bug.
    const refs = await db.collection(collectionName).listDocuments();
    const data = {};
    let parentCount = 0;
    let subDocCount = 0;

    for (const ref of refs) {
        parentCount++;
        // Capture any own fields on the parent. For a missing parent this is a
        // harmless no-op (snap.exists === false); store {} rather than the
        // `undefined` from snap.data() so we never write undefined into JSON.
        const parentSnap = await ref.get();
        data[ref.id] = {
            _data: parentSnap.exists ? parentSnap.data() : {},
            _subcollections: {},
        };

        for (const subName of subcollectionNames) {
            const subSnapshot = await ref.collection(subName).get();
            if (subSnapshot.size > 0) {
                data[ref.id]._subcollections[subName] = {};
                subSnapshot.forEach((subDoc) => {
                    data[ref.id]._subcollections[subName][subDoc.id] = subDoc.data();
                    subDocCount++;
                });
                console.log(`     → ${ref.id}/${subName}: ${subSnapshot.size} documents`);
            }
        }
    }

    console.log(`     → ${parentCount} parent ref(s), ${subDocCount} subcollection document(s)`);
    return data;
}

// Count parent refs and the total data/* documents captured for the `users`
// collection, so an empty (broken) backup can be detected and reported.
function countUserDataDocs(usersData) {
    let parents = 0;
    let docs = 0;
    for (const uid of Object.keys(usersData || {})) {
        parents++;
        const subs = (usersData[uid] && usersData[uid]._subcollections) || {};
        for (const subName of Object.keys(subs)) {
            docs += Object.keys(subs[subName] || {}).length;
        }
    }
    return { parents, docs };
}

// Decide the final on-disk fate of a just-written backup file. A zero-doc
// backup is quarantined under an `.INVALID` suffix so it can never be mistaken
// for a valid recovery point; a real backup keeps its plain `*.json` name.
// Returns the final path and whether the backup is trustworthy.
function finalizeBackup(filepath, docs) {
    if (docs === 0) {
        const invalidPath = `${filepath}.INVALID`;
        fs.renameSync(filepath, invalidPath);
        return { path: invalidPath, valid: false };
    }
    return { path: filepath, valid: true };
}

async function runBackup() {
    console.log('🔥 Starting Firestore backup...\n');

    // Admin SDK + service-account are only needed for a real run; requiring
    // them here (not at module top) keeps this file importable by the unit
    // test without a service-account key present. Auth is unchanged.
    const admin = require('firebase-admin');
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    const db = admin.firestore();

    const backup = {
        metadata: {
            createdAt: new Date().toISOString(),
            projectId: serviceAccount.project_id,
            version: '1.0',
        },
        collections: {},
    };

    try {
        // List all top-level collections
        const collections = await db.listCollections();
        const collectionNames = collections.map((c) => c.id);
        console.log(`Found ${collectionNames.length} collections: ${collectionNames.join(', ')}\n`);

        // Backup each collection
        for (const name of collectionNames) {
            // For user documents, also grab subcollections
            if (name === 'users') {
                backup.collections[name] = await backupSubcollections(db, name, ['data']);
            } else {
                backup.collections[name] = await backupCollection(db, name);
            }
        }

        // Create backups directory
        const backupDir = path.join(__dirname, '..', 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Generate timestamped filename
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
        const filename = `${timestamp}_backup.json`;
        const filepath = path.join(backupDir, filename);

        // Write backup file
        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

        const fileSizeKB = (fs.statSync(filepath).size / 1024).toFixed(1);
        const { parents, docs } = countUserDataDocs(backup.collections.users);

        // A backup with zero user data documents is almost certainly broken —
        // this is exactly the failure the old script hid behind an
        // unconditional success message. Quarantine the written file under an
        // unmistakably-invalid name and fail loudly, so an empty backup is
        // never mistaken for a valid recovery point — a plain `*.json` is left
        // behind ONLY on success.
        const { path: finalPath, valid } = finalizeBackup(filepath, docs);
        console.log(`\n📊 Captured ${parents} user parent ref(s), ${docs} user data document(s).`);

        if (!valid) {
            console.error('❌ Backup captured 0 user data documents — treating as FAILED.');
            console.error(`   Quarantined as: ${finalPath}`);
            console.error('   Kept for inspection but must NOT be trusted as a recovery point.');
            console.error('   Check the service account / project and that data still lives');
            console.error('   under users/{uid}/data/*.');
            process.exit(1);
        }

        console.log(`   📁 File: ${finalPath}`);
        console.log(`   📊 Size: ${fileSizeKB} KB`);
        console.log(`   🕐 Time: ${backup.metadata.createdAt}`);

        console.log('\n✅ Backup saved successfully!');
    } catch (error) {
        console.error('\n❌ Backup failed:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

module.exports = { backupCollection, backupSubcollections, countUserDataDocs, finalizeBackup, runBackup };

// Only run the backup when invoked directly (node scripts/backup.cjs), so the
// functions above can be imported by the unit test without side effects.
if (require.main === module) {
    runBackup();
}
