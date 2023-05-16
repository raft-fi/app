import { CollateralToken } from '@raft-fi/sdk';
import { BehaviorSubject } from 'rxjs';
import { Decimal } from '@tempusfinance/decimal';
import { bind } from '@react-rxjs/core';
import { Nullable } from '../interfaces';

export type NotificationType = 'approval-pending' | 'approval-success' | 'approval-error';

export interface Notification {
  notificationId: string;
  notificationType: NotificationType;
  token: CollateralToken;
  amount: Decimal;
  timestamp: number;
}

const DEFAULT_VALUE = null;

const notification$ = new BehaviorSubject<Nullable<Notification>>(DEFAULT_VALUE);

export const [useNotification] = bind<Nullable<Notification>>(notification$, DEFAULT_VALUE);

export { notification$ };
