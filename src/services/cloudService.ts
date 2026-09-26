import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Worker, WorkRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const WORKERS_COLLECTION = 'workers';
const RECORDS_COLLECTION = 'records';

/**
 * Real-time listener for Workers collection
 */
export function subscribeToWorkers(
  onUpdate: (workers: Worker[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, WORKERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const workersList: Worker[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        workersList.push({
          id: docSnap.id,
          name: data.name || '',
          dailyWage: Number(data.dailyWage) || 0,
          trade: data.trade || '',
          phone: data.phone || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      // Sort: newest first or by createdAt
      workersList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(workersList);
    },
    (err) => {
      console.warn('Firestore workers subscription notice:', err.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Records collection
 */
export function subscribeToRecords(
  onUpdate: (records: WorkRecord[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, RECORDS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const recordsList: WorkRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        recordsList.push({
          id: docSnap.id,
          workerId: data.workerId || '',
          date: data.date || '',
          days: Number(data.days) || 0,
          paid: Number(data.paid) || 0,
          advance: Number(data.advance) || 0,
          note: data.note || undefined,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      // Sort by date descending
      recordsList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      onUpdate(recordsList);
    },
    (err) => {
      console.warn('Firestore records subscription notice:', err.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a worker in Firestore
 */
export async function saveWorkerToCloud(worker: Worker): Promise<void> {
  const docRef = doc(db, WORKERS_COLLECTION, worker.id);
  try {
    await setDoc(docRef, {
      id: worker.id,
      name: worker.name,
      dailyWage: worker.dailyWage,
      trade: worker.trade || '',
      phone: worker.phone || '',
      createdAt: worker.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${WORKERS_COLLECTION}/${worker.id}`);
  }
}

/**
 * Delete a worker from Firestore (and optionally clean up their records)
 */
export async function deleteWorkerFromCloud(workerId: string): Promise<void> {
  const docRef = doc(db, WORKERS_COLLECTION, workerId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${WORKERS_COLLECTION}/${workerId}`);
  }

  // Also remove records associated with this worker
  try {
    const recordsSnap = await getDocs(collection(db, RECORDS_COLLECTION));
    const batch = writeBatch(db);
    let count = 0;
    recordsSnap.forEach((d) => {
      if (d.data().workerId === workerId) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.warn('Error cleaning up worker records in cloud:', err);
  }
}

/**
 * Save or update a work record in Firestore
 */
export async function saveRecordToCloud(record: WorkRecord): Promise<void> {
  const docRef = doc(db, RECORDS_COLLECTION, record.id);
  try {
    await setDoc(docRef, {
      id: record.id,
      workerId: record.workerId,
      date: record.date,
      days: record.days,
      paid: record.paid,
      advance: record.advance,
      note: record.note || '',
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${RECORDS_COLLECTION}/${record.id}`);
  }
}

/**
 * Update an existing work record in Firestore
 */
export async function updateRecordInCloud(record: WorkRecord): Promise<void> {
  await saveRecordToCloud(record);
}

/**
 * Delete a record from Firestore
 */
export async function deleteRecordFromCloud(recordId: string): Promise<void> {
  const docRef = doc(db, RECORDS_COLLECTION, recordId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${RECORDS_COLLECTION}/${recordId}`);
  }
}

const SETTINGS_COLLECTION = 'settings';
const SYSTEM_META_DOC = 'system_meta';

/**
 * Migrate local data to cloud if cloud is currently empty and uninitialized
 */
export async function migrateLocalDataToCloudIfEmpty(
  localWorkers: Worker[],
  localRecords: WorkRecord[]
): Promise<boolean> {
  try {
    const metaRef = doc(db, SETTINGS_COLLECTION, SYSTEM_META_DOC);
    const workersSnap = await getDocs(collection(db, WORKERS_COLLECTION));

    if (workersSnap.empty && localWorkers.length > 0) {
      console.log('Cloud database is brand new. Uploading local workers and records...');
      const batch = writeBatch(db);
      localWorkers.forEach((w) => {
        const wRef = doc(db, WORKERS_COLLECTION, w.id);
        batch.set(wRef, {
          id: w.id,
          name: w.name,
          dailyWage: w.dailyWage,
          trade: w.trade || '',
          phone: w.phone || '',
          createdAt: w.createdAt || new Date().toISOString(),
        });
      });
      localRecords.forEach((r) => {
        const rRef = doc(db, RECORDS_COLLECTION, r.id);
        batch.set(rRef, {
          id: r.id,
          workerId: r.workerId,
          date: r.date,
          days: r.days,
          paid: r.paid,
          advance: r.advance,
          note: r.note || '',
          createdAt: r.createdAt || new Date().toISOString(),
        });
      });

      // Mark initialized
      batch.set(metaRef, {
        initialized: true,
        initializedAt: new Date().toISOString(),
      });

      await batch.commit();
      console.log('Local data successfully migrated to Firebase Cloud!');
      return true;
    } else {
      // Mark as initialized so empty states aren't re-seeded
      await setDoc(metaRef, { initialized: true }, { merge: true });
    }
  } catch (err) {
    console.error('Error during cloud data migration:', err);
  }
  return false;
}

/**
 * Batch replace cloud data (e.g. for restoring from backup or reset)
 */
export async function replaceAllCloudData(
  workers: Worker[],
  records: WorkRecord[]
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Delete all existing docs
  const [curWorkers, curRecords] = await Promise.all([
    getDocs(collection(db, WORKERS_COLLECTION)),
    getDocs(collection(db, RECORDS_COLLECTION)),
  ]);

  curWorkers.forEach((d) => batch.delete(d.ref));
  curRecords.forEach((d) => batch.delete(d.ref));

  // 2. Set new docs
  workers.forEach((w) => {
    const wRef = doc(db, WORKERS_COLLECTION, w.id);
    batch.set(wRef, {
      id: w.id,
      name: w.name,
      dailyWage: w.dailyWage,
      trade: w.trade || '',
      phone: w.phone || '',
      createdAt: w.createdAt || new Date().toISOString(),
    });
  });

  records.forEach((r) => {
    const rRef = doc(db, RECORDS_COLLECTION, r.id);
    batch.set(rRef, {
      id: r.id,
      workerId: r.workerId,
      date: r.date,
      days: r.days,
      paid: r.paid,
      advance: r.advance,
      note: r.note || '',
      createdAt: r.createdAt || new Date().toISOString(),
    });
  });

  await batch.commit();
}
