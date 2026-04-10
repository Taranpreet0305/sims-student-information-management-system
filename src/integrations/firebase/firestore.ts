import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as limitDocs,
  onSnapshot,
  orderBy as orderByDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type WhereFilterOp,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "./client";

export type WhereClause = {
  field: string;
  op: WhereFilterOp;
  value: unknown;
};

export type OrderClause = {
  field: string;
  direction?: "asc" | "desc";
};

const normalizeTimestamps = (data: DocumentData) => {
  const normalized: DocumentData = { ...data };
  Object.keys(normalized).forEach((key) => {
    const value = normalized[key];
    if (value instanceof Timestamp) {
      normalized[key] = value.toDate().toISOString();
    }
  });
  return normalized;
};

const buildConstraints = (clauses?: WhereClause[], order?: OrderClause, limit?: number) => {
  const constraints: QueryConstraint[] = [];
  if (clauses?.length) {
    clauses.forEach((clause) => {
      constraints.push(where(clause.field, clause.op, clause.value));
    });
  }
  if (order) {
    constraints.push(orderByDocs(order.field, order.direction ?? "asc"));
  }
  if (limit) {
    constraints.push(limitDocs(limit));
  }
  return constraints;
};

export async function getDocById<T>(collectionName: string, id: string) {
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...normalizeTimestamps(snap.data()) } as T;
}

export async function listDocs<T>(
  collectionName: string,
  options?: {
    where?: WhereClause[];
    orderBy?: OrderClause;
    limit?: number;
  }
) {
  const ref = collection(db, collectionName);
  const constraints = buildConstraints(options?.where, options?.orderBy, options?.limit);
  const snap = await getDocs(query(ref, ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...normalizeTimestamps(d.data()) })) as T[];
}

export async function getOneDoc<T>(
  collectionName: string,
  clauses: WhereClause[],
  options?: { orderBy?: OrderClause }
) {
  const docs = await listDocs<T>(collectionName, {
    where: clauses,
    orderBy: options?.orderBy,
    limit: 1,
  });
  return docs[0] ?? null;
}

export async function setDocById(
  collectionName: string,
  id: string,
  data: DocumentData
) {
  const ref = doc(db, collectionName, id);
  await setDoc(ref, data, { merge: true });
  return id;
}

export async function updateDocById(
  collectionName: string,
  id: string,
  data: DocumentData
) {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, data);
  return id;
}

export async function deleteDocById(collectionName: string, id: string) {
  const ref = doc(db, collectionName, id);
  await deleteDoc(ref);
}

export async function countDocs(collectionName: string, clauses?: WhereClause[]) {
  const ref = collection(db, collectionName);
  const constraints = buildConstraints(clauses);
  const snap = await getCountFromServer(query(ref, ...constraints));
  return snap.data().count;
}

export function subscribeDocs<T>(
  collectionName: string,
  options: {
    where?: WhereClause[];
    orderBy?: OrderClause;
    limit?: number;
  },
  onChange: (docs: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = collection(db, collectionName);
  const constraints = buildConstraints(options.where, options.orderBy, options.limit);
  return onSnapshot(
    query(ref, ...constraints),
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...normalizeTimestamps(d.data()) })) as T[];
      onChange(docs);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export function nowIso() {
  return new Date().toISOString();
}
