import { memo } from 'react';

const RaftLogo = () => {
  const raftLogoTextColor = 'var(--raftLogoTextColor, var(--raftHeaderTextDark))';

  return (
    <svg width="148" height="43" viewBox="0 0 148 43" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="21.6038" cy="21.5905" rx="20.8324" ry="20.7321" fill="white" />
      <path
        d="M22.7462 38.6923C26.7701 38.4163 30.7156 36.7475 33.7916 33.686C36.8604 30.6317 38.5364 26.7161 38.8196 22.721L29.4755 22.721C29.2252 24.3405 28.4734 25.8981 27.2201 27.1456C25.9594 28.4003 24.3835 29.15 22.7462 29.3947V38.6923Z"
        fill="url(#paint0_linear_313_13222)"
      />
      <path
        d="M20.4829 38.7008L20.4829 29.4133C18.7985 29.1897 17.1718 28.4338 15.8774 27.1456C14.624 25.8981 13.8722 24.3405 13.6219 22.721L4.27791 22.721C4.56114 26.7161 6.23713 30.6317 9.30589 33.686C12.4154 36.7809 16.4135 38.4525 20.4829 38.7008Z"
        fill="url(#paint1_linear_313_13222)"
      />
      <path
        d="M4.26562 20.4684C4.50894 16.4084 6.18903 12.4177 9.30589 9.31558C12.4154 6.22066 16.4135 4.54907 20.4829 4.30078V13.5886C18.7985 13.8121 17.1718 14.568 15.8774 15.8563C14.5757 17.1518 13.815 18.7819 13.5952 20.4684L4.26562 20.4684Z"
        fill="url(#paint2_linear_313_13222)"
      />
      <path
        d="M22.7462 4.3093L22.7462 13.6071C24.3835 13.8519 25.9594 14.6016 27.2201 15.8563C28.5218 17.1518 29.2825 18.7819 29.5023 20.4684H38.8319C38.5886 16.4084 36.9085 12.4177 33.7916 9.31558C30.7156 6.25401 26.7701 4.58525 22.7462 4.3093Z"
        fill="url(#paint3_linear_313_13222)"
      />
      <path
        d="M81.9217 33.3802C80.2553 35.2847 78.3243 36.237 76.1288 36.237C73.8275 36.237 71.8833 35.4038 70.2962 33.7373C68.7356 32.0709 67.4659 29.5051 66.4872 26.0399L65.8524 24.056H60.1785V32.3883H65.1778V35.6815H50.9733V32.428H56.0917V11.756H50.9733V8.4628H66.7649C69.8598 8.4628 72.3066 9.16377 74.1053 10.5657C75.904 11.9676 76.8033 13.8722 76.8033 16.2793C76.8033 18.2631 76.1553 19.9428 74.8591 21.3183C73.5895 22.6673 71.7908 23.5138 69.463 23.8576L70.1772 25.8018C70.9972 28.1296 71.9098 29.8225 72.9149 30.8806C73.9201 31.9386 75.0575 32.4676 76.3272 32.4676C77.1208 32.4676 77.7953 32.3089 78.3508 31.9915C78.9062 31.6741 79.422 31.2509 79.8982 30.7218L81.9217 33.3802ZM60.1785 20.9612H66.884C68.5769 20.9612 69.9788 20.5512 71.0898 19.7312C72.2008 18.8847 72.7562 17.7341 72.7562 16.2793C72.7562 14.8773 72.2008 13.7796 71.0898 12.986C70.0053 12.166 68.6033 11.756 66.884 11.756H60.1785V20.9612Z"
        fill={raftLogoTextColor}
      />
      <path
        d="M104.337 35.2054C103.464 35.7344 102.446 35.9989 101.282 35.9989C100.303 35.9989 99.4702 35.7212 98.7825 35.1657C98.1212 34.5838 97.6583 33.7638 97.3938 32.7057C94.7486 35.0599 92.1299 36.237 89.5376 36.237C87.7125 36.237 86.165 35.7212 84.8954 34.6896C83.6257 33.658 82.9908 32.2164 82.9908 30.3647C82.9908 29.0951 83.3479 27.9973 84.0621 27.0715C84.7763 26.1193 85.7286 25.4051 86.9189 24.9289C88.1357 24.4264 89.445 24.1751 90.847 24.1751C92.0373 24.1751 93.135 24.2941 94.1402 24.5322C95.1454 24.7438 96.177 25.0612 97.235 25.4844V23.7386C97.235 22.3896 96.7854 21.3976 95.886 20.7628C94.9867 20.128 93.8096 19.8105 92.3547 19.8105C90.2915 19.8105 87.805 20.3793 84.8954 21.5167L84.1018 18.5012C87.2231 17.1786 90.1328 16.5173 92.8309 16.5173C95.3967 16.5173 97.3805 17.1522 98.7825 18.4218C100.211 19.6651 100.925 21.4902 100.925 23.8973V30.7615C100.925 32.0576 101.388 32.7057 102.314 32.7057C102.711 32.7057 103.121 32.5999 103.544 32.3883L104.337 35.2054ZM86.8396 30.1664C86.8396 31.0657 87.1967 31.7667 87.9109 32.2693C88.625 32.7454 89.4979 32.9835 90.5296 32.9835C91.4289 32.9835 92.4605 32.7454 93.6244 32.2693C94.7883 31.7931 95.9918 31.0922 97.235 30.1664V28.0635C95.4363 27.4286 93.5318 27.0847 91.5215 27.0318C90.2254 27.0318 89.1144 27.3096 88.1886 27.8651C87.2892 28.3941 86.8396 29.1612 86.8396 30.1664Z"
        fill={raftLogoTextColor}
      />
      <path
        d="M118.129 9.89119C116.912 9.89119 115.933 10.2747 115.192 11.0418C114.452 11.8089 114.082 12.867 114.082 14.216V16.9935H120.033V20.128H114.082V32.547H119.557V35.6815H106.027V32.547H110.233V20.128H106.027V16.9935H110.233V14.3351C110.233 11.8751 110.907 9.97054 112.256 8.62151C113.632 7.27248 115.457 6.59796 117.732 6.59796C118.896 6.59796 119.954 6.75667 120.906 7.07409C121.885 7.36506 123.009 7.80151 124.279 8.38345L122.85 11.3989C122.03 10.9228 121.237 10.5525 120.47 10.288C119.729 10.0234 118.949 9.89119 118.129 9.89119Z"
        fill={raftLogoTextColor}
      />
      <path
        d="M138.921 34.3722C137.942 34.9541 136.977 35.4038 136.025 35.7212C135.099 36.0386 134.028 36.1973 132.811 36.1973C130.774 36.1973 129.147 35.5625 127.93 34.2928C126.74 32.9967 126.145 31.1583 126.145 28.7776V20.128H121.979V16.9935H126.145V11.7957H130.033V16.9935H136.223V20.128H130.033V28.8173C130.033 30.1664 130.338 31.1583 130.946 31.7931C131.554 32.428 132.374 32.7454 133.406 32.7454C134.147 32.7454 134.848 32.6396 135.509 32.428C136.17 32.1899 136.858 31.8593 137.572 31.436L138.921 34.3722Z"
        fill={raftLogoTextColor}
      />
      <path
        d="M143.949 36.1973C143.049 36.1973 142.282 35.9593 141.647 35.4831C141.013 34.9806 140.695 34.3589 140.695 33.6183C140.695 32.8247 141.013 32.1767 141.647 31.6741C142.282 31.1715 143.049 30.9202 143.949 30.9202C144.927 30.9202 145.721 31.1715 146.329 31.6741C146.964 32.1767 147.282 32.8247 147.282 33.6183C147.282 34.3589 146.964 34.9806 146.329 35.4831C145.721 35.9593 144.927 36.1973 143.949 36.1973Z"
        fill={raftLogoTextColor}
      />
      <defs>
        <linearGradient
          id="paint0_linear_313_13222"
          x1="8.75786"
          y1="10.1011"
          x2="34.519"
          y2="33.2434"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF661E" />
          <stop offset="1" stopColor="#FF9308" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_313_13222"
          x1="8.75786"
          y1="10.1011"
          x2="34.519"
          y2="33.2434"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF661E" />
          <stop offset="1" stopColor="#FF9308" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_313_13222"
          x1="8.75786"
          y1="10.1011"
          x2="34.519"
          y2="33.2434"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF661E" />
          <stop offset="1" stopColor="#FF9308" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_313_13222"
          x1="8.75786"
          y1="10.1011"
          x2="34.519"
          y2="33.2434"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF661E" />
          <stop offset="1" stopColor="#FF9308" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default memo(RaftLogo);
