import { memo } from 'react';

import './LoadingPage.scss';

const NetworkSelector = () => (
  <div className="raft__loading-bridge__network-selector-container">
    <div className="raft__loading-bridge__network-selector">
      <div className="raft__loading-page__title" />
      <div className="raft__loading-page__input-field" />
    </div>
    <div className="raft__loading-page__btn" />
    <div className="raft__loading-bridge__network-selector">
      <div className="raft__loading-page__title" />
      <div className="raft__loading-page__input-field" />
    </div>
  </div>
);

const Input = () => (
  <div className="raft__loading-page__input">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__input-field" />
  </div>
);

const Receive = () => (
  <div className="raft__loading-bridge__receive">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-bridge__receive__text" />
  </div>
);

const TimeToArrive = () => (
  <div className="raft__loading-bridge__time-to-arrive">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value" />
  </div>
);

const GasFee = () => (
  <div className="raft__loading-bridge__gas-fee">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value" />
  </div>
);

const Button = () => <div className="raft__loading-page__btn" />;

const LoadingBridge = () => (
  <div className="raft__loading-bridge">
    <div className="raft__loading-bridge-container">
      <div className="raft__loading-page__value" />
      <NetworkSelector />
      <Input />
      <Receive />
      <TimeToArrive />
      <GasFee />
      <Button />
    </div>
  </div>
);

export default memo(LoadingBridge);
