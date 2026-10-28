const DATABASE_NAME = "vsr-preparation-workspace";
const DATABASE_VERSION = 1;
const FOLDERS_STORE = "folders";
const ITEMS_STORE = "items";

const defaultFolders = [
  { id: "folder-interview-prep", name: "Interview Preparation", color: "#7c6cf2" },
  { id: "folder-study-notes", name: "Study Notes", color: "#22a996" },
  { id: "folder-project-plans", name: "Project Plans", color: "#e5a84b" },
  { id: "folder-resources", name: "Resources", color: "#e87991" },
];

let databasePromise;

function openDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("This browser does not support local file storage."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(FOLDERS_STORE)) {
          database.createObjectStore(FOLDERS_STORE, { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains(ITEMS_STORE)) {
          const items = database.createObjectStore(ITEMS_STORE, { keyPath: "id" });
          items.createIndex("folderId", "folderId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = undefined;
        reject(request.error ?? new Error("Could not open the local workspace."));
      };
      request.onblocked = () => {
        databasePromise = undefined;
        reject(new Error("Workspace storage is blocked by another browser tab."));
      };
    });
  }

  return databasePromise;
}

function transactionCompletion(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("A workspace storage operation failed."));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("A workspace storage operation was cancelled."));
    };
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error ?? new Error("Could not read from local workspace storage."));
    };
  });
}

export async function loadWorkspace() {
  const database = await openDatabase();
  const transaction = database.transaction(
    [FOLDERS_STORE, ITEMS_STORE],
    "readonly",
  );
  const completion = transactionCompletion(transaction);
  const foldersRequest = requestResult(
    transaction.objectStore(FOLDERS_STORE).getAll(),
  );
  const itemsRequest = requestResult(transaction.objectStore(ITEMS_STORE).getAll());
  const [folders, items] = await Promise.all([
    foldersRequest,
    itemsRequest,
    completion,
  ]);
  return { folders, items };
}

export async function initializeWorkspace() {
  const database = await openDatabase();
  const transaction = database.transaction(FOLDERS_STORE, "readwrite");
  const completion = transactionCompletion(transaction);
  const store = transaction.objectStore(FOLDERS_STORE);
  const countRequest = store.count();
  const seedRequest = new Promise((resolve, reject) => {
    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        defaultFolders.forEach((folder) => store.add(folder));
      }
      resolve();
    };
    countRequest.onerror = () => {
      reject(countRequest.error ?? new Error("Could not initialize workspace folders."));
    };
  });

  await Promise.all([seedRequest, completion]);
  return loadWorkspace();
}

export async function saveFolder(folder) {
  const database = await openDatabase();
  const transaction = database.transaction(FOLDERS_STORE, "readwrite");
  const completion = transactionCompletion(transaction);
  transaction.objectStore(FOLDERS_STORE).put(folder);
  await completion;
}

export async function saveItem(item) {
  const database = await openDatabase();
  const transaction = database.transaction(ITEMS_STORE, "readwrite");
  const completion = transactionCompletion(transaction);
  transaction.objectStore(ITEMS_STORE).put(item);
  await completion;
}

export async function deleteItem(itemId) {
  const database = await openDatabase();
  const transaction = database.transaction(ITEMS_STORE, "readwrite");
  const completion = transactionCompletion(transaction);
  transaction.objectStore(ITEMS_STORE).delete(itemId);
  await completion;
}

export async function deleteFolderAndItems(folderId) {
  const database = await openDatabase();
  const transaction = database.transaction(
    [FOLDERS_STORE, ITEMS_STORE],
    "readwrite",
  );
  const completion = transactionCompletion(transaction);
  const itemsStore = transaction.objectStore(ITEMS_STORE);
  const folderStore = transaction.objectStore(FOLDERS_STORE);
  const folderIds = Array.isArray(folderId) ? folderId : [folderId];
  const deleteRequests = folderIds.map(
    (id) =>
      new Promise((resolve, reject) => {
        const itemsRequest = itemsStore.index("folderId").getAllKeys(id);
        itemsRequest.onsuccess = () => {
          itemsRequest.result.forEach((itemId) => itemsStore.delete(itemId));
          folderStore.delete(id);
          resolve();
        };
        itemsRequest.onerror = () => {
          reject(
            itemsRequest.error ??
              new Error("Could not delete the folder contents."),
          );
        };
      }),
  );

  await Promise.all([...deleteRequests, completion]);
}
