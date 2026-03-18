/**
 * Firestore Restore Script
 * 
 * Restores user data from a backup JSON file back into Firestore.
 * Usage: node scripts/restore.js <backup-file>
 * Example: node scripts/restore.js backups/20260317_220000_backup.json
 * 
 * ⚠️ WARNING: This will OVERWRITE existing data in Firestore!
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

async function restoreCollection(collectionName, data) {
    console.log(`  📥 Restoring collection: ${collectionName}`);
    let count = 0;

    for (const [docId, docData] of Object.entries(data)) {
        // Handle documents with subcollections
        if (docData._data && docData._subcollections) {
            await db.collection(collectionName).doc(docId).set(docData._data, { merge: true });
            count++;

            // Restore subcollections
            for (const [subName, subDocs] of Object.entries(docData._subcollections)) {
                for (const [subDocId, subDocData] of Object.entries(subDocs)) {
                    await db.collection(collectionName).doc(docId).collection(subName).doc(subDocId).set(subDocData, { merge: true });
                    console.log(`     → ${collectionName}/${docId}/${subName}/${subDocId}`);
                }
            }
        } else {
            await db.collection(collectionName).doc(docId).set(docData, { merge: true });
            count++;
        }
    }

    console.log(`     → ${count} documents restored`);
}

async function runRestore() {
    const backupFile = process.argv[2];

    if (!backupFile) {
        console.error('❌ Usage: node scripts/restore.js <backup-file>');
        console.error('   Example: node scripts/restore.js backups/20260317_220000_backup.json');

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

        // Confirm before proceeding
        console.log('⚠️  This will MERGE data into Firestore (existing fields will be overwritten).');
        console.log('   Press Ctrl+C within 5 seconds to cancel...\n');

        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Restore each collection
        for (const [collectionName, collectionData] of Object.entries(backup.collections)) {
            await restoreCollection(collectionName, collectionData);
        }

        console.log('\n✅ Restore completed successfully!');
    } catch (error) {
        console.error('\n❌ Restore failed:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

runRestore();
