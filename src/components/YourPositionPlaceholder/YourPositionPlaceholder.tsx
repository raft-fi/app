import { Typography } from '../shared';
import './YourPositionPlaceholder.scss';

const YourPositionPlaceholder = () => {
  return (
    <div className="raft__yourPositionPlaceholder">
      <Typography variant="body" weight="medium" color="text-secondary">
        Your leverage position will appear here
      </Typography>
    </div>
  );
};
export default YourPositionPlaceholder;
