import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const Gitbook: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--gitbookColor, var(--textSecondary))';

  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_596_5949)">
        <path
          d="M8.99996 14.8125C9.31246 14.8125 9.59371 15.0625 9.59371 15.4063C9.59371 15.7188 9.34371 16 8.99996 16C8.68746 16 8.40621 15.75 8.40621 15.4063C8.40621 15.0625 8.68746 14.8125 8.99996 14.8125ZM18.1875 11.1875C17.875 11.1875 17.5937 10.9375 17.5937 10.5938C17.5937 10.2813 17.8437 10 18.1875 10C18.5 10 18.7812 10.25 18.7812 10.5938C18.7812 10.9063 18.5 11.1875 18.1875 11.1875ZM18.1875 8.78126C17.1875 8.78126 16.375 9.59376 16.375 10.5938C16.375 10.7813 16.4062 10.9688 16.4687 11.1563L10.5 14.3438C10.1562 13.8438 9.59371 13.5625 8.99996 13.5625C8.31246 13.5625 7.68746 13.9688 7.37496 14.5625L1.99996 11.75C1.43746 11.4375 0.999963 10.5313 1.06246 9.65626C1.09371 9.21876 1.24996 8.87501 1.46871 8.75001C1.62496 8.65626 1.78121 8.68751 1.99996 8.78126L2.03121 8.81251C3.46871 9.56251 8.12496 12 8.31246 12.0938C8.62496 12.2188 8.78121 12.2813 9.31246 12.0313L18.9375 7.03126C19.0937 6.96876 19.25 6.84376 19.25 6.62501C19.25 6.34376 18.9687 6.21876 18.9687 6.21876C18.4062 5.96876 17.5625 5.56251 16.75 5.18751C15 4.37501 13 3.43751 12.125 2.96876C11.375 2.56251 10.75 2.90626 10.6562 2.96876L10.4375 3.06251C6.46871 5.06251 1.21871 7.65626 0.906213 7.84376C0.374962 8.15626 0.0312124 8.81251 -3.76119e-05 9.62501C-0.0625376 10.9063 0.593712 12.25 1.53121 12.7188L7.21871 15.6563C7.34371 16.5313 8.12496 17.2188 8.99996 17.2188C9.99996 17.2188 10.7812 16.4375 10.8125 15.4375L17.0625 12.0625C17.375 12.3125 17.7812 12.4375 18.1875 12.4375C19.1875 12.4375 20 11.625 20 10.625C20 9.59376 19.1875 8.78126 18.1875 8.78126Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_596_5949">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default withIcon(Gitbook);
