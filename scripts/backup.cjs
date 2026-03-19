/**
 * Firestore Backup Script
 * 
 * Exports all user data from Firestore to a timestamped JSON file.
 * Usage: node scripts/backup.js
 * 
 * Backups are saved to: backups/YYYY-MM-DD_HHmmss_backup.json
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

async function backupCollection(collectionName) {
    console.log(`  📦 Backing up collection: ${collectionName}`);
    const snapshot = await db.collection(collectionName).get();
    const data = {};
    snapshot.forEach((doc) => {
        data[doc.id] = doc.data();
    });
    console.log(`     → ${snapshot.size} documents`);
    return data;
}

async function backupSubcollections(collectionName, subcollectionNames) {
    console.log(`  📦 Backing up collection with subcollections: ${collectionName}`);
    const snapshot = await db.collection(collectionName).get();
    const data = {};

    for (const doc of snapshot.docs) {
        data[doc.id] = {
            _data: doc.data(),
            _subcollections: {},
        };

        for (const subName of subcollectionNames) {
            const subSnapshot = await doc.ref.collection(subName).get();
            if (subSnapshot.size > 0) {
                data[doc.id]._subcollections[subName] = {};
                subSnapshot.forEach((subDoc) => {
                    data[doc.id]._subcollections[subName][subDoc.id] = subDoc.data();
                });
                console.log(`     → ${doc.id}/${subName}: ${subSnapshot.size} documents`);
            }
        }
    }

    return data;
}

async function runBackup() {
    console.log('🔥 Starting Firestore backup...\n');

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
                backup.collections[name] = await backupSubcollections(name, [
                    'workoutData',
                    'dietData',
                ]);
            } else {
                backup.collections[name] = await backupCollection(name);
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
        console.log(`\n✅ Backup saved successfully!`);
        console.log(`   📁 File: ${filepath}`);
        console.log(`   📊 Size: ${fileSizeKB} KB`);
        console.log(`   🕐 Time: ${backup.metadata.createdAt}`);
    } catch (error) {
        console.error('\n❌ Backup failed:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

runBackup();
