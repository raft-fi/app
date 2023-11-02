import React from 'react';
import { createRoot } from 'react-dom/client';
import isMobile from 'is-mobile';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'tempus-ui/dist/index.css';
import Header from './components/Header';
import Footer from './components/Footer';
import GenerateDashboard from './components/GenerateDashboard';
import Geoblock from './components/Geoblock';
import HookSubscriber from './components/HookSubscriber';
import NoticePopup from './components/NoticePopup';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import NotificationCenter from './components/NotificationCenter';
import TransactionModal from './components/TransactionModal';
import PositionPicker from './components/PositionPicker';
import LeverageDashboard from './components/LeverageDashboard';
import Savings from './components/Savings';
import Bridge from './components/Bridge';
import Stake from './components/Stake';
import MobileBanner from './components/MobileBanner';

import './index.scss';

const mobile = isMobile();

const root = createRoot(document.getElementById('root') as HTMLDivElement);

if (mobile) {
  root.render(
    <React.StrictMode>
      <MobileBanner />
    </React.StrictMode>,
  );
} else {
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
            <Route path="/savings" element={<Savings />} />
            <Route path="/bridge" element={<Bridge />} />
            <Route
              path="/generate"
              element={
                <>
                  <GenerateDashboard />
                  <NotificationCenter />
                </>
              }
            />
            <Route path="/leverage" element={<LeverageDashboard />} />
            <Route path="/stake" element={<Stake />} />
            <Route path="/" element={<PositionPicker />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Footer />
          <Geoblock />
        </div>
      </BrowserRouter>
    </React.StrictMode>,
  );
}
