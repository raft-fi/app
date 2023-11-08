import { memo } from 'react';

import './LoadingPage.scss';

const Input = () => (
  <div className="raft__loading-page__input">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__input-field" />
  </div>
);

const TokenValue = () => (
  <div className="raft__loading-stake__token-value">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value-container">
      <div className="raft__loading-page__icon" />
      <div className="raft__loading-page__value" />
    </div>
  </div>
);

const PeriodPicker = () => (
  <div className="raft__loading-stake__period-picker">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__btn" />
    <div className="raft__loading-page__btn" />
    <div className="raft__loading-page__btn" />
  </div>
);

const GasFee = () => (
  <div className="raft__loading-stake__gas-fee">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value" />
  </div>
);

const Button = () => <div className="raft__loading-page__btn" />;

const Position = () => (
  <div className="raft__loading-stake__position">
    <div className="raft__loading-page__value" />
    <div className="raft__loading-stake__position__desc">
      <div className="raft__loading-page__desc" />
      <div className="raft__loading-page__desc" />
      <div className="raft__loading-page__desc" />
      <div className="raft__loading-page__desc" />
    </div>
    <Input />
    <Input />
    <PeriodPicker />
    <TokenValue />
    <TokenValue />
    <GasFee />
    <Button />
  </div>
);

const FAQ = () => (
  <div className="raft__loading-stake__faq">
    <div className="raft__loading-page__title" />
  </div>
);

const LoadingStake = () => (
  <div className="raft__loading-stake">
    <Position />
    <div className="raft__loading-stake__sidebar">
      <FAQ />
      <FAQ />
    </div>
  </div>
);

export default memo(LoadingStake);
