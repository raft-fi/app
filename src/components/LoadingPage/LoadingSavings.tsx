import { memo } from 'react';

import './LoadingPage.scss';

const Input = () => (
  <div className="raft__loading-page__input">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__input-field" />
  </div>
);

const PositionAfter = () => (
  <div className="raft__loading-savings__position-after">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value-container">
      <div className="raft__loading-page__icon" />
      <div className="raft__loading-page__value" />
    </div>
  </div>
);

const GasFee = () => (
  <div className="raft__loading-savings__gas-fee">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__value" />
  </div>
);

const Button = () => <div className="raft__loading-page__btn" />;

const Position = () => (
  <div className="raft__loading-savings__position">
    <div className="raft__loading-page__value" />
    <div className="raft__loading-page__desc" />
    <Input />
    <PositionAfter />
    <GasFee />
    <Button />
  </div>
);

const StatRow = () => (
  <div className="raft__loading-savings__stat-row">
    <div className="raft__loading-page__title" />
    <div className="raft__loading-page__input-field" />
  </div>
);

const Stat = () => (
  <div className="raft__loading-savings__stat">
    <StatRow />
    <StatRow />
    <StatRow />
  </div>
);

const FAQ = () => (
  <div className="raft__loading-savings__faq">
    <div className="raft__loading-page__title" />
  </div>
);

const LoadingSavings = () => (
  <div className="raft__loading-savings">
    <Position />
    <div className="raft__loading-savings__sidebar">
      <Stat />
      <FAQ />
    </div>
  </div>
);

export default memo(LoadingSavings);
