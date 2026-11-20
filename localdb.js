(function (root) {
  'use strict';

  const DB_NAME = 'com5507-workbench-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'workspace';
  const STATE_KEY = 'current-state';
  let dbPromise;
  let persistencePromise;

  function available() {
    return typeof root.indexedDB !== 'undefined';
  }

  function open() {
    if (!available()) return Promise.reject(new Error('当前浏览器不支持 IndexedDB'));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = root.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('本机数据库打开失败'));
      });
    }
    return dbPromise;
  }

  function requestPersistence() {
    if (persistencePromise) return persistencePromise;
    if (!root.navigator || !root.navigator.storage || !root.navigator.storage.persist) {
      persistencePromise = Promise.resolve(false);
      return persistencePromise;
    }
    persistencePromise = root.navigator.storage.persist().catch(() => false);
    return persistencePromise;
  }

  async function getState() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(STATE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('本机数据库读取失败'));
    });
  }

  async function setState(state) {
    await requestPersistence();
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({
        state,
        updatedAt: new Date().toISOString()
      }, STATE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('本机数据库写入失败'));
      tx.onabort = () => reject(tx.error || new Error('本机数据库写入已中止'));
    });
  }

  async function clearState() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(STATE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('本机数据库清理失败'));
    });
  }

  async function estimate() {
    if (!root.navigator || !root.navigator.storage || !root.navigator.storage.estimate) return null;
    return root.navigator.storage.estimate();
  }

  root.WorkbenchLocalDB = {
    available,
    open,
    getState,
    setState,
    clearState,
    estimate,
    requestPersistence
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
