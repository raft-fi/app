import { add } from 'date-fns';
import { Link } from 'react-router-dom';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { ModalWrapper, Typography, Checkbox, Button } from '../shared';

import './NoticePopup.scss';

const STORAGE_KEY = 'notice-popup-show-after';

const NoticePopup = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [doNotShowIn, setDoNotShowIn] = useState<boolean>(true);

  useEffect(() => {
    const showAfter = localStorage.getItem(STORAGE_KEY);

    // TODO - Include bellow line once we add legal pages to the app
    // const isTermsPage = window.location.pathname === '/terms-and-conditions';

    if (!showAfter || Number(showAfter) < Date.now() /*&& !isTermsPage*/) {
      setOpen(true);
    }
  }, []);

  const handleModalClose = useCallback(() => {
    // Popup should not be closable - only way to close it is to accept the terms
  }, []);

  const handleTermsAccepted = useCallback(() => {
    if (doNotShowIn) {
      const targetDate = add(new Date(), {
        days: 30,
      });

      localStorage.setItem(STORAGE_KEY, targetDate.getTime().toString());
    }

    setOpen(false);
  }, [doNotShowIn]);

  const onDoNotShowInChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDoNotShowIn(event.target.checked);
  }, []);

  return (
    <ModalWrapper open={open} onClose={handleModalClose}>
      <div className="raft__noticePopup">
        <div className="raft__noticePopup__title">
          <Typography variant="subheader" weight="medium">
            Notice
          </Typography>
        </div>

        <div className="raft__noticePopup__description">
          <Typography variant="body-primary">
            Please note that this app is not hosted by raft.fi. It is an independently deployed and maintained instance
            of the Raft protocol.
          </Typography>

          <Typography variant="body-primary">
            By clicking Agree, you confirm that you have read and understood this Notice and the{' '}
            <Link className="raft__link" to="/privacy">
              Privacy Policy
            </Link>
            . You also agree to be bound by the{' '}
            <Link className="raft__link" to="/terms-and-conditions">
              Terms & Conditions
            </Link>
            .
          </Typography>
        </div>

        <div className="raft__noticePopup__checkbox">
          <Checkbox
            id="do-not-show-in-30-days"
            checked={doNotShowIn}
            label="Don't show this notice again for 30 days"
            onChange={onDoNotShowInChange}
          />
        </div>

        <div className="raft__noticePopup__action">
          <Button variant="primary" onClick={handleTermsAccepted}>
            <Typography variant="subtitle" weight="medium" color="text-primary-inverted">
              Agree
            </Typography>
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};
export default NoticePopup;
