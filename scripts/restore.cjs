/**
 * Firestore Restore Script
 *
 * Restores user data from a backup JSON file back into Firestore.
 *
 * Usage:   node scripts/restore.cjs <backup-file> [--overwrite]
 * Example: node scripts/restore.cjs backups/20260317_220000_backup.json
 *
 * Modes:
 *   (default)     MERGE   — non-destructive. Backed-up fields are written over
 *                           the live docs, but fields/documents that are absent
 *                           from the backup are left untouched.
 *   --overwrite   REPLACE — point-in-time restore. Each backed-up doc REPLACES
 *                           the live doc (set without merge), so fields present
 *                           live but absent from the backup are REMOVED. This is
 *                           destructive and therefore opt-in via the flag.
 *
 * NOTE: --overwrite replaces each restored document's fields; it does not
 * delete live documents that are absent from the backup (subcollection pruning
 * is intentionally out of scope).
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function restoreCollection(collectionName, data, overwrite) {
    console.log(`  📥 Restoring collection: ${collectionName}`);
    let count = 0;

    // In overwrite mode we set() WITHOUT merge, so keys absent from the backup
    // are removed (true point-in-time replace). In the default merge mode
    // absent keys are preserved (non-destructive overlay).
    const writeDoc = (ref, docData) =>
        overwrite ? ref.set(docData) : ref.set(docData, { merge: true });

    for (const [docId, docData] of Object.entries(data)) {
        // Handle documents with subcollections
        if (docData._data && docData._subcollections) {
            await writeDoc(db.collection(collectionName).doc(docId), docData._data);
            count++;

            // Restore subcollections
            for (const [subName, subDocs] of Object.entries(docData._subcollections)) {
                for (const [subDocId, subDocData] of Object.entries(subDocs)) {
                    await writeDoc(
                        db.collection(collectionName).doc(docId).collection(subName).doc(subDocId),
                        subDocData
                    );
                    console.log(`     → ${collectionName}/${docId}/${subName}/${subDocId}`);
                }
            }
        } else {
            await writeDoc(db.collection(collectionName).doc(docId), docData);
            count++;
        }
    }

    console.log(`     → ${count} documents restored`);
}

function printUsage() {
    console.error('❌ Usage: node scripts/restore.cjs <backup-file> [--overwrite]');
    console.error('   Example: node scripts/restore.cjs backups/20260317_220000_backup.json');
    console.error('');
    console.error('   Modes:');
    console.error('     (default)    MERGE   — non-destructive overlay; keys absent from the');
    console.error('                            backup are left untouched.');
    console.error('     --overwrite  REPLACE — point-in-time restore; each backed-up doc replaces');
    console.error('                            the live doc, so keys absent from the backup are');
    console.error('                            REMOVED (destructive, opt-in).');
}

async function runRestore() {
    const args = process.argv.slice(2);
    const overwrite = args.includes('--overwrite');
    const backupFile = args.find((a) => !a.startsWith('--'));

    if (!backupFile) {
        printUsage();

        // List available backups
        const backupDir = path.join(__dirname, '..', 'backups');
        if (fs.existsSync(backupDir)) {
            const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('_backup.json'));
            if (files.length > 0) {
                console.log('\n📁 Available backups:');
                files.forEach((f) => console.log(`   • backups/${f}`));
            }
        }
        process.exit(1);
    }

    const filepath = path.resolve(backupFile);
    if (!fs.existsSync(filepath)) {
        console.error(`❌ Backup file not found: ${filepath}`);
        process.exit(1);
    }

    console.log('🔥 Starting Firestore restore...');
    console.log(`   📁 From: ${filepath}\n`);

    try {
        const backup = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

        console.log(`   Backup created: ${backup.metadata.createdAt}`);
        console.log(`   Project: ${backup.metadata.projectId}\n`);

        // Confirm before proceeding — the wording MUST match the actual mode.
        if (overwrite) {
            console.log('⚠️  OVERWRITE (REPLACE) mode: each backed-up document will REPLACE the');
            console.log('   live document (set without merge). Fields present live but absent from');
            console.log('   the backup will be REMOVED. This is destructive.');
        } else {
            console.log('ℹ️  MERGE mode (default): backed-up fields are written over the live');
            console.log('   documents; fields/documents absent from the backup are left untouched.');
            console.log('   Re-run with --overwrite for a destructive point-in-time replace.');
        }
        console.log('   Press Ctrl+C within 5 seconds to cancel...\n');

        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Restore each collection
        for (const [collectionName, collectionData] of Object.entries(backup.collections)) {
            await restoreCollection(collectionName, collectionData, overwrite);
        }

        console.log(`\n✅ Restore completed successfully! (${overwrite ? 'REPLACE' : 'MERGE'} mode)`);
    } catch (error) {
        console.error('\n❌ Restore failed:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

runRestore();
