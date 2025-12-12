import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CloudFlareAccount, Domain } from '@/types';
import { encryptStorage } from '@/lib/encryption';

interface AppState {
  // 账户管理
  accounts: CloudFlareAccount[];
  selectedAccount: string | null;
  addAccount: (account: CloudFlareAccount) => void;
  removeAccount: (id: string) => void;
  selectAccount: (email: string) => void;
  importAccounts: (accounts: CloudFlareAccount[]) => void;
  exportAccounts: () => CloudFlareAccount[];

  // 域名管理
  domains: Domain[];
  selectedDomain: string | null;
  selectedDomains: string[]; // 多选域名
  setDomains: (domains: Domain[]) => void;
  selectDomain: (domainId: string | null) => void;
  toggleDomainSelection: (domainId: string) => void; // 切换域名选中状态
  clearDomainSelection: () => void; // 清空多选
  updateDomainSafety: (domainId: string, safetyStatus: 'safe' | 'unsafe' | 'checking' | 'unknown', threats?: string[]) => void; // 更新域名安全状态

  // Google Safe Browsing API Key
  googleApiKey: string;
  setGoogleApiKey: (key: string) => void;

  // 认证
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      accounts: [],
      selectedAccount: null,
      domains: [],
      selectedDomain: null,
      selectedDomains: [],
      googleApiKey: '',
      isAuthenticated: false,

      // 账户操作
      addAccount: (account) => {
        set((state) => ({
          accounts: [...state.accounts, account],
        }));
      },

      removeAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((acc) => acc.id !== id),
          selectedAccount:
            state.selectedAccount === id ? null : state.selectedAccount,
        }));
      },

      selectAccount: (email) => {
        set({ selectedAccount: email, selectedDomain: null, selectedDomains: [] });
      },

      importAccounts: (accounts) => {
        set({ accounts });
      },

      exportAccounts: () => {
        return get().accounts;
      },

      // 域名操作
      setDomains: (domains) => {
        set({ domains });
      },

      selectDomain: (domainId) => {
        set({ selectedDomain: domainId, selectedDomains: [] });
      },

      toggleDomainSelection: (domainId) => {
        set((state) => {
          const isSelected = state.selectedDomains.includes(domainId);
          return {
            selectedDomains: isSelected
              ? state.selectedDomains.filter((id) => id !== domainId)
              : [...state.selectedDomains, domainId],
            selectedDomain: null, // 多选模式下清除单选
          };
        });
      },

      clearDomainSelection: () => {
        set({ selectedDomains: [] });
      },

      updateDomainSafety: (domainId, safetyStatus, threats) => {
        set((state) => ({
          domains: state.domains.map((domain) =>
            domain.id === domainId
              ? { ...domain, safetyStatus, threats }
              : domain
          ),
        }));
      },

      // Google API Key
      setGoogleApiKey: (key) => {
        set({ googleApiKey: key });
      },

      // 认证
      setAuthenticated: (value) => {
        set({ isAuthenticated: value });
      },
    }),
    {
      name: 'opsflare-storage',
      storage: {
        getItem: (name) => {
          const value = encryptStorage.getItem<AppState>(name);
          return value ? { state: value } : null;
        },
        setItem: (name, value) => {
          encryptStorage.setItem(name, value.state);
        },
        removeItem: (name) => {
          encryptStorage.removeItem(name);
        },
      },
    }
  )
);
