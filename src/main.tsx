import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'tempus-ui/dist/index.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Background from './components/Background';
import Dashboard from './components/Dashboard';
import Redeem from './components/Redeem';
import Geoblock from './components/Geoblock';

import './index.scss';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="raft__app__root">
        <Background />
        <Header />
        <Routes>
          <Route path="/redeem" element={<Redeem />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
        <Geoblock />
      </div>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root'),
);
