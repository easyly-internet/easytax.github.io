import create from 'zustand';
import { persist } from 'zustand/middleware';
import { Member } from '../services/memberService';
import { Document } from '../services/documentService';
import { TaxCalculation, TaxFilingStatus } from '../services/taxService';

// Define app state interface
interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Member State
  selectedMember: Member | null;
  setSelectedMember: (member: Member | null) => void;

  // Year State
  selectedFinancialYear: string;
  setSelectedFinancialYear: (year: string) => void;

  // Document State
  recentDocuments: Document[];
  setRecentDocuments: (documents: Document[]) => void;
  addRecentDocument: (document: Document) => void;

  // Tax Filing State
  currentTaxCalculation: TaxCalculation | null;
  setCurrentTaxCalculation: (calculation: TaxCalculation | null) => void;

  taxFilingStatus: TaxFilingStatus | null;
  setTaxFilingStatus: (status: TaxFilingStatus | null) => void;

  // Theme State
  darkMode: boolean;
  toggleDarkMode: () => void;

  // App State
  loading: Record<string, boolean>;
  setLoading: (key: string, isLoading: boolean) => void;

  notifications: Array<{
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
    read: boolean;
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

// Create the store with persistence for selected fields
const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Default UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Default Member State
      selectedMember: null,
      setSelectedMember: (member) => set({ selectedMember: member }),

      // Default Year State
      selectedFinancialYear: (() => {
        const currentYear = new Date().getFullYear();
        const month = new Date().getMonth(); // 0-11 (0 is January)
        // If we're in or after April (month >= 3), use current year, otherwise use previous year
        const fiscalYearStart = month >= 3 ? currentYear : currentYear - 1;
        return `${fiscalYearStart} - ${fiscalYearStart + 1}`;
      })(),
      setSelectedFinancialYear: (year) => set({ selectedFinancialYear: year }),

      // Default Document State
      recentDocuments: [],
      setRecentDocuments: (documents) => set({ recentDocuments: documents }),
      addRecentDocument: (document) =>
        set((state) => ({
          recentDocuments: [
            document,
            ...state.recentDocuments.filter(d => d.id !== document.id)
          ].slice(0, 10) // Keep only 10 most recent
        })),

      // Default Tax Filing State
      currentTaxCalculation: null,
      setCurrentTaxCalculation: (calculation) => set({ currentTaxCalculation: calculation }),

      taxFilingStatus: null,
      setTaxFilingStatus: (status) => set({ taxFilingStatus: status }),

      // Default Theme State
      darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches || false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // Default App State
      loading: {},
      setLoading: (key, isLoading) =>
        set((state) => ({
          loading: {
            ...state.loading,
            [key]: isLoading
          }
        })),

      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              id: Date.now().toString(),
              ...notification,
              read: false
            },
            ...state.notifications
          ]
        })),
      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        })),
      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'taxsahihai-app-state',
      // Only persist certain parts of the state
      partialize: (state) => ({
        darkMode: state.darkMode,
        selectedFinancialYear: state.selectedFinancialYear,
        recentDocuments: state.recentDocuments,
      }),
    }
  )
);

export default useStore;