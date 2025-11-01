// Track storage using IndexedDB for file persistence

window.VixelAudioStorage = (function() {
  const DB_NAME = 'vixel_audio_tracks';
  const DB_VERSION = 1;
  const STORE_NAME = 'tracks';
  const MAX_STORED_TRACKS = 20; // Limit to prevent storage bloat

  let db = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve(db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[Storage] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        
        // Create object store if it doesn't exist
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('fileName', 'fileName', { unique: false });
          store.createIndex('lastLoaded', 'lastLoaded', { unique: false });
        }
      };
    });
  }

  async function saveTrack(file) {
    try {
      // Read file data and check for existing tracks BEFORE opening transaction
      const fileData = await file.arrayBuffer();
      const existingTracks = await getAllTracks();
      const existingTrack = existingTracks.find(
        t => t.fileName === file.name && t.fileSize === file.size && t.lastModified === file.lastModified
      );
      
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let trackData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        lastModified: file.lastModified,
        lastLoaded: Date.now(),
        fileData: fileData
      };

      return new Promise((resolve, reject) => {
        if (existingTrack) {
          // Update existing track
          trackData.id = existingTrack.id;
          const updateRequest = store.put(trackData);
          updateRequest.onsuccess = () => {
            resolve(trackData);
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          // Add new track
          const addRequest = store.add(trackData);
          addRequest.onsuccess = () => {
            trackData.id = addRequest.result;
            resolve(trackData);
            
            // Clean up old tracks if we exceed the limit
            cleanupOldTracks();
          };
          addRequest.onerror = () => reject(addRequest.error);
        }
      });
    } catch (error) {
      console.error('[Storage] Failed to save track:', error);
      throw error;
    }
  }

  async function getAllTracks() {
    try {
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('lastLoaded');

      return new Promise((resolve, reject) => {
        const request = index.openCursor(null, 'prev'); // Sort by lastLoaded descending
        const tracks = [];

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            tracks.push(cursor.value);
            cursor.continue();
          } else {
            resolve(tracks);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[Storage] Failed to get tracks:', error);
      return [];
    }
  }

  async function loadTrack(trackId) {
    try {
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get(trackId);
        request.onsuccess = () => {
          if (request.result) {
            // Convert ArrayBuffer back to File
            const trackData = request.result;
            const blob = new Blob([trackData.fileData], { type: trackData.fileType });
            const file = new File([blob], trackData.fileName, {
              type: trackData.fileType,
              lastModified: trackData.lastModified
            });
            resolve(file);
          } else {
            reject(new Error('Track not found'));
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[Storage] Failed to load track:', error);
      throw error;
    }
  }

  async function deleteTrack(trackId) {
    try {
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.delete(trackId);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[Storage] Failed to delete track:', error);
      throw error;
    }
  }

  async function updateTrackTimestamp(trackId) {
    try {
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const getRequest = store.get(trackId);
        getRequest.onsuccess = () => {
          const track = getRequest.result;
          if (track) {
            track.lastLoaded = Date.now();
            const putRequest = store.put(track);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error('[Storage] Failed to update timestamp:', error);
      // Don't throw - this is not critical
    }
  }

  async function cleanupOldTracks() {
    try {
      const tracks = await getAllTracks();
      if (tracks.length <= MAX_STORED_TRACKS) {
        return;
      }

      // Delete oldest tracks (keep most recent MAX_STORED_TRACKS)
      const tracksToDelete = tracks.slice(MAX_STORED_TRACKS);
      
      for (const track of tracksToDelete) {
        await deleteTrack(track.id);
      }
      
    } catch (error) {
      console.error('[Storage] Failed to cleanup old tracks:', error);
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  return {
    saveTrack,
    getAllTracks,
    loadTrack,
    deleteTrack,
    formatFileSize,
    formatDate
  };
})();

