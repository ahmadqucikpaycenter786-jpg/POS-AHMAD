import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AndroidHeader } from './components/AndroidHeader';
import { BottomNav } from './components/BottomNav';
import { ReceiptsTab } from './components/ReceiptsTab';
import { ScanPrintTab } from './components/ScanPrintTab';
import { QrBarcodeTab } from './components/QrBarcodeTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { PrintModal } from './components/PrintModal';
import { ToastContainer } from './components/Toast';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Android Top Header */}
      <AndroidHeader />

      {/* Main Tab Screen */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {activeTab === 'receipts' && <ReceiptsTab />}
        {activeTab === 'scan_print' && <ScanPrintTab />}
        {activeTab === 'qr_barcode' && <QrBarcodeTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Fixed Bottom Ergonomic Thumb Navigation */}
      <BottomNav />

      {/* Print Visualizer Modal */}
      <PrintModal />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
