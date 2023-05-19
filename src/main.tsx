import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'tempus-ui/dist/index.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import Redeem from './components/Redeem';
import Stats from './components/Stats';
import Geoblock from './components/Geoblock';
import HookSubscriber from './components/HookSubscriber';
import NoticePopup from './components/NoticePopup';

import './index.scss';

const root = createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="raft__app__root">
        <NoticePopup />
        <HookSubscriber />
        <Header />
        <Routes>
          <Route path="/redeem" element={<Redeem />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
        <Geoblock />
      </div>
    </BrowserRouter>
  </React.StrictMode>,
);
