import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'tempus-ui/dist/index.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import Redeem from './components/Redeem';
import Geoblock from './components/Geoblock';
import HookSubscriber from './components/HookSubscriber';
import NoticePopup from './components/NoticePopup';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import NotificationCenter from './components/NotificationCenter';
import TransactionModal from './components/TransactionModal';

import './index.scss';

const root = createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="raft__app__root">
        <HookSubscriber />
        <Header />
        <NoticePopup />
        <TransactionModal />
        <Routes>
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/redeem" element={<Redeem />} />
          <Route
            path="/"
            element={
              <>
                <Dashboard />
                <NotificationCenter />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
        <Geoblock />
      </div>
    </BrowserRouter>
  </React.StrictMode>,
);
