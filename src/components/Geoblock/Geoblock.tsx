import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Icon, Typography } from '../shared';

import './Geoblock.scss';

const Geoblock = () => {
  const [countryCode, setCountryCode] = useState<string>('');

  useEffect(() => {
    const getLocation = async () => {
      // TODO - Get paid version of API in order to use https
      try {
        const response = await axios.get('http://ip-api.com/json');

        setCountryCode(response.data.countryCode);
      } catch (error) {
        console.error(error);

        // Retry after 1 second
        setTimeout(getLocation, 1000);
      }
    };
    getLocation();
  }, []);

  const isGeoblocked = useMemo(() => {
    return countryCode === 'US';
  }, [countryCode]);

  if (!isGeoblocked) {
    return null;
  }

  return (
    <div className="raft__geoblock">
      <div className="raft__geoblock__modal">
        <Icon variant="geoblock" size={142} />
        <Typography className="raft__geoblock__title" variant="subheader" weight="medium">
          We're sorry.
        </Typography>
        <Typography className="raft__geoblock__subtitle" variant="subtitle" weight="medium">
          Raft is not available in the US.
        </Typography>
      </div>
    </div>
  );
};
export default Geoblock;
