// Persistent draft storage for the Add Property form.
//
// localStorage is unsuitable: it tops out around 5 MB and stringifying images
// to base64 would blow that limit with even one or two watermarked photos.
// IndexedDB stores File / Blob objects natively and has multi-GB capacity, so
// we keep one "current draft" record per logged-in admin (see draftKey).

const DB_NAME = "ppc_admin_drafts";
const STORE = "addProperty";
const KEY = "current";
const DB_VERSION = 1;

// A draft older than this is treated as abandoned: it is cleared instead of
// offered for restore. Anchored on savedAt, which is refreshed on every
// auto-save, so a form that is being actively edited never expires — only one
// left untouched does. This is what protects a shared PC (the previous admin's
// stale draft is gone) and a stale second tab.
export const DRAFT_TTL_MS = 35 * 60 * 1000; // 35 minutes

export function isDraftExpired(draft, ttlMs = DRAFT_TTL_MS) {
  if (!draft || !draft.savedAt) return false;
  const savedTime = new Date(draft.savedAt).getTime();
  if (Number.isNaN(savedTime)) return false;
  return Date.now() - savedTime > ttlMs;
}

// Per-admin draft key. IndexedDB is shared by every admin who uses the same
// browser profile (e.g. a shared office computer), so a single fixed key would
// let one admin see / overwrite another's in-progress draft. Namespacing the
// key by the logged-in admin keeps each person's draft isolated even on a
// shared machine. Falls back to the bare KEY when no admin name is available.
function draftKey() {
  try {
    const name = localStorage.getItem("adminName");
    return name ? `${KEY}::${name}` : KEY;
  } catch {
    return KEY;
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function runTx(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let result;
        try {
          result = fn(store);
        } catch (err) {
          reject(err);
          return;
        }
        tx.oncomplete = () => {
          db.close();
          resolve(
            result && typeof result === "object" && "result" in result
              ? result.result
              : result
          );
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error || new Error("IndexedDB transaction aborted"));
        };
      })
  );
}

// payload shape: { formData, photos: File[], videos: File[],
//                  selectedPhotoIndex, ppcId, savedAt }
export async function saveDraft(payload) {
  const toStore = { ...payload, savedAt: new Date().toISOString() };
  try {
    await runTx("readwrite", (store) => store.put(toStore, draftKey()));
    return true;
  } catch (err) {
    // Most likely cause is the user being in a private window where
    // IndexedDB is unavailable. Fail silently so the form keeps working.
    return false;
  }
}

export async function loadDraft() {
  try {
    const draft = await runTx("readonly", (store) => {
      const req = store.get(draftKey());
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    });
    if (draft && isDraftExpired(draft)) {
      // Older than the TTL — wipe it and report "no draft" so it is never
      // offered for restore.
      await clearDraft();
      return null;
    }
    return draft;
  } catch (err) {
    return null;
  }
}

export async function clearDraft() {
  try {
    await runTx("readwrite", (store) => store.delete(draftKey()));
    return true;
  } catch (err) {
    return false;
  }
}

export async function hasDraft() {
  const d = await loadDraft();
  return d !== null;
}

// Returns true if the draft has anything worth restoring (at least one
// non-empty form field, photo, or video). Used to avoid prompting users
// when the previous session never typed anything.
export function isDraftMeaningful(draft) {
  if (!draft) return false;
  const photoCount = Array.isArray(draft.photos) ? draft.photos.length : 0;
  const videoCount = Array.isArray(draft.videos) ? draft.videos.length : 0;
  if (photoCount > 0 || videoCount > 0) return true;
  const f = draft.formData || {};
  return Object.keys(f).some((k) => {
    const v = f[k];
    return v !== "" && v !== null && v !== undefined;
  });
}
