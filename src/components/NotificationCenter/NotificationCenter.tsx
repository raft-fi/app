import { memo, ReactNode, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNotification } from '../../hooks';
import { Icon, Typography } from '../shared';

import './NotificationCenter.scss';
import 'react-toastify/dist/ReactToastify.css';

const TOAST_ID = 'RAFT_TOAST';
const TOAST_DEFAULT_OPTIONS = {
  toastId: TOAST_ID,
  autoClose: 10000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: false,
  progress: 0,
  closeButton: false,
};

const renderToast = (render: ReactNode) => {
  if (toast.isActive(TOAST_ID)) {
    toast.update(TOAST_ID, {
      ...TOAST_DEFAULT_OPTIONS,
      render,
    });
  } else {
    toast(render, TOAST_DEFAULT_OPTIONS);
  }
};

const NotificationCenter = () => {
  const notification = useNotification();

  useEffect(() => {
    if (notification) {
      switch (notification.notificationType) {
        case 'approval-pending':
          renderToast(
            <Typography className="raft__notification raft__notification__approvalPending" variant="body">
              Approval pending...
            </Typography>,
          );
          break;
        case 'approval-success':
          renderToast(
            <Typography className="raft__notification raft__notification__approvalSucceed" variant="body">
              <Icon variant="success" size="medium" />
              Approval succeeded
            </Typography>,
          );
          break;
        case 'approval-error':
          renderToast(
            <Typography className="raft__notification raft__notification__approvalFailed" variant="body">
              <Icon variant="error" size="medium" />
              Approval failed
            </Typography>,
          );
          break;
        default:
      }
    }
  }, [notification]);

  return <ToastContainer />;
};

export default memo(NotificationCenter);
