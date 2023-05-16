import { memo, ReactNode, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNotification } from '../../hooks';
import { Icon, Typography } from '../shared';

import './NotificationCenter.scss';
import 'react-toastify/dist/ReactToastify.css';

const TOAST_ID = 'RAFT_TOAST';
const renderToast = (render: ReactNode) => {
  if (toast.isActive(TOAST_ID)) {
    toast.update(TOAST_ID, {
      toastId: TOAST_ID,
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      progress: undefined,
      closeButton: false,
      render,
    });
  } else {
    toast(
      <Typography className="raft__notification raft__notification__approving" variant="body-secondary">
        Approval pending...
      </Typography>,
      {
        toastId: TOAST_ID,
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        closeButton: false,
      },
    );
  }
};

const NotificationCenter = () => {
  const notification = useNotification();

  useEffect(() => {
    if (notification) {
      switch (notification?.notificationType) {
        case 'approving':
          renderToast(
            <Typography className="raft__notification raft__notification__approving" variant="body-secondary">
              Approval pending...
            </Typography>,
          );
          break;
        case 'approved':
          renderToast(
            <Typography
              className="raft__notification raft__notification__approved"
              variant="body-secondary"
              color="text-success"
            >
              <Icon variant="success" size="small" />
              Approval successful
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
