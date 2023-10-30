import { memo } from 'react';

const Row = () => (
  <div className="raft__loading-stat-mobile__row">
    <div className="raft__loading-mobile__title" />
    <div className="raft__loading-mobile__value">
      <div className="raft__loading-mobile__value-icon" />
      <div className="raft__loading-mobile__value-number" />
    </div>
  </div>
);

const LoadingStatMobile = () => (
  <div className="raft__loading-stat-mobile">
    <Row />
    <Row />
    <Row />
  </div>
);

export default memo(LoadingStatMobile);
