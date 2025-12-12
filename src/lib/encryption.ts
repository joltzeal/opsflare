import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'opsflare-secret-key-2024';

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

export const encryptStorage = {
  setItem: (key: string, value: unknown): void => {
    if (!isBrowser) return;
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('加密存储失败:', error);
    }
  },

  getItem: <T>(key: string): T | null => {
    if (!isBrowser) return null;
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString) return null;
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('解密读取失败:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  },

  clear: (): void => {
    if (!isBrowser) return;
    localStorage.clear();
  }
};
