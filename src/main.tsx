import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'tempus-ui/dist/index.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Background from './components/Background';
import Dashboard from './components/Dashboard';
import Redeem from './components/Redeem';
import Geoblock from './components/Geoblock';
import HookSubscriber from './components/HookSubscriber';

import './index.scss';

const root = createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="raft__app__root">
        <HookSubscriber />
        <Background />
        <Header />
        <Routes>
          <Route path="/redeem" element={<Redeem />} />
          <Route path="/stats" element={<Redeem />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
        <Geoblock />
      </div>
    </BrowserRouter>
  </React.StrictMode>,
);
