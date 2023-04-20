import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Geoblock: FC<InnerIconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 142 142" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="71.3832" cy="71.3832" r="60.3832" fill="#F76329" fill-opacity="0.25" />
    <circle cx="71" cy="71" r="71" fill="#F76329" fill-opacity="0.25" />
    <circle cx="71.1028" cy="71.1028" r="49.1028" fill="#F76329" />
    <path
      d="M71.5 100.25C67.5708 100.25 63.8573 99.4948 60.3594 97.9845C56.8615 96.4742 53.8063 94.4138 51.1939 91.8033C48.5834 89.1928 46.523 86.1385 45.0126 82.6406C43.5023 79.1427 42.7481 75.4292 42.75 71.5C42.75 67.5229 43.5052 63.7969 45.0155 60.322C46.5258 56.8471 48.5863 53.8053 51.1968 51.1968C53.8073 48.5843 56.8605 46.5239 60.3565 45.0155C63.8525 43.5071 67.567 42.7519 71.5 42.75C73.0333 42.75 74.5073 42.8583 75.9218 43.0749C77.3363 43.2915 78.7373 43.6144 80.125 44.0438V51.375C80.125 52.9563 79.5615 54.3104 78.4345 55.4374C77.3075 56.5644 75.9543 57.1269 74.375 57.125H68.625V62.875C68.625 63.6896 68.349 64.3729 67.797 64.9249C67.245 65.4769 66.5627 65.7519 65.75 65.75H60V71.5H77.25C78.0646 71.5 78.7479 71.776 79.2999 72.328C79.8519 72.88 80.1269 73.5623 80.125 74.375V83H83C84.2938 83 85.4323 83.3833 86.4155 84.15C87.3988 84.9167 88.0811 85.875 88.4625 87.025C90.3313 84.9167 91.8052 82.5563 92.8843 79.9439C93.9633 77.3315 94.5019 74.5168 94.5 71.5C94.5 70.9729 94.476 70.4938 94.4281 70.0625C94.3802 69.6313 94.3083 69.1521 94.2125 68.625H100.106C100.202 69.1521 100.25 69.6313 100.25 70.0625V71.5C100.25 75.4292 99.4958 79.1427 97.9874 82.6406C96.479 86.1385 94.4185 89.1937 91.8061 91.8061C89.1937 94.4166 86.151 96.4771 82.678 97.9874C79.205 99.4977 75.479 100.252 71.5 100.25ZM68.625 94.3563V88.75C67.0438 88.75 65.6896 88.1865 64.5626 87.0595C63.4356 85.9325 62.8731 84.5793 62.875 83V80.125L49.075 66.325C48.9313 67.1875 48.799 68.05 48.6783 68.9125C48.5575 69.775 48.4981 70.6375 48.5 71.5C48.5 77.4417 50.4291 82.5573 54.2874 86.8468C58.1456 91.1363 62.9248 93.6394 68.625 94.3563ZM85.875 62.875V48.5H88.75V45.625C88.75 44.0438 89.3135 42.6896 90.4405 41.5626C91.5675 40.4356 92.9207 39.8731 94.5 39.875C96.0813 39.875 97.4354 40.4385 98.5624 41.5655C99.6894 42.6925 100.252 44.0457 100.25 45.625V48.5H103.125V62.875H85.875ZM91.625 48.5H97.375V45.625C97.375 44.8104 97.099 44.1271 96.547 43.5751C95.995 43.0231 95.3127 42.7481 94.5 42.75C93.6854 42.75 93.0021 43.026 92.4501 43.578C91.8981 44.13 91.6231 44.8123 91.625 45.625V48.5Z"
      fill="white"
    />
  </svg>
);

export default withIcon(Geoblock);
