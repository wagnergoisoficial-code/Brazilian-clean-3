
/**
 * Mock Storage Service
 * ---------------------
 * This service simulates uploading a file to a cloud storage provider (like Supabase Storage or S3).
 * It accepts a base64 string, converts it to a Blob, and returns a local object URL.
 * This architectural change is critical to prevent storing large data payloads in localStorage.
 */

/**
 * Converts a base64 string to a Blob object.
 * @param base64 - The base64 string (e.g., from a canvas or file reader).
 * @returns A Blob object.
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Simulates uploading a document and returns a URL.
 * In a real application, this would use a client library like `@supabase/storage-js`.
 * @param base64Data - The base64 encoded image data.
 * @returns A promise that resolves with a local blob URL representing the "uploaded" file.
 */
export const uploadDocument = (base64Data: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      try {
        if (!base64Data) {
          throw new Error("Cannot upload empty data.");
        }
        const blob = base64ToBlob(base64Data);
        const url = URL.createObjectURL(blob);
        console.log(`[StorageService] Mock Upload Success. Blob URL: ${url}`);
        resolve(url);
      } catch (error) {
        console.error("[StorageService] Mock Upload Failed:", error);
        reject(new Error("File processing failed. Please try again."));
      }
    }, 1200); // 1.2 second simulated delay
  });
};

/**
 * Cleans up blob URLs to prevent memory leaks.
 * This should be called when the component unmounts or the URL is no longer needed.
 * @param url - The blob URL to revoke.
 */
export const cleanupStorageUrl = (url: string) => {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
        console.log(`[StorageService] Revoked Blob URL: ${url}`);
    }
};
