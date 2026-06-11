import { IconSvgProps } from "@/types";

export const LogoIcon = (props: IconSvgProps) => (
  <svg
    viewBox="0 0 1024 1024"
    aria-hidden="true"
    focusable="false"
    role="presentation"
    height="1em"
    width="1em"
    {...props}
  >
    <path d="M279.164 67.256c-54.485 6.975-102.749 31.107-142.34 71.264-35.256 35.633-57.125 77.298-67.306 127.447-3.205 15.837-3.393 32.24-3.393 246.033s.188 230.196 3.393 246.033c17.91 88.42 77.486 157.423 161.76 187.21 37.14 13.198 26.205 12.632 282.607 12.632 218.13 0 231.893-.188 246.976-3.582 48.83-10.746 87.855-31.296 122.545-64.477 36.575-35.256 59.952-77.11 70.887-127.07 3.394-15.082 3.582-28.657 3.582-249.803 0-218.885-.188-234.721-3.393-249.804-7.919-36.952-22.435-69.379-43.74-97.847-36.951-49.395-85.78-81.257-145.357-94.643l-18.664-4.336-227.18-.377c-125.75-.188-233.024.377-240.377 1.32m145.17 236.983c62.026 17.533 115.569 72.207 131.782 134.8l2.263 8.86 14.14-12.443c43.739-39.025 64.665-57.878 98.224-88.043 20.927-19.042 40.534-35.067 45.247-37.141 5.28-2.45 12.255-3.77 20.55-3.77 28.845 0 49.207 22.058 46.379 50.149-1.886 18.287-4.336 21.115-77.11 85.781-37.705 33.37-69.944 62.027-71.641 63.724-3.205 2.828.188 6.221 50.903 52.223 29.788 27.148 62.215 56.559 72.208 65.42 21.115 19.041 26.205 28.09 26.205 46.001-.188 17.534-9.426 33.182-25.263 41.666-9.05 4.901-33.747 4.336-43.739-.943-4.336-2.262-22.247-17.156-39.78-32.993s-48.83-44.116-69.568-62.592c-20.55-18.665-39.78-35.821-42.42-38.46l-5.09-4.337-4.147 13.763C535 647.365 482.589 698.834 419.43 717.687c-12.82 3.96-18.664 4.336-74.28 4.902-58.634.943-60.708.754-71.454-3.394-13.386-4.901-26.394-16.967-33.181-30.919l-4.714-9.426V343.265l5.28-10.935c6.22-12.631 17.721-23 32.05-29.034 9.615-4.147 11.123-4.336 72.96-3.77 58.823.565 64.29.942 78.241 4.713" data-spm-anchor-id="a313x.manage_type_myprojects.0.i4.5fbf3a81mvD2dL"/>
    <path d="M328.937 413.398c-.943 76.167-.943 177.973-.189 195.13l.943 20.361h29.6c33.369 0 43.361-2.074 60.517-12.443 21.493-12.82 38.084-36.198 44.117-61.461 3.77-15.837 3.77-72.961.188-90.306-5.09-23.567-16.78-41.854-35.82-55.24-20.928-15.082-27.526-16.779-65.61-17.722l-33.558-.754z"/>
  </svg>
)

export const SearchIcon = (props: IconSvgProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M22 22L20 20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export const MoonFilledIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <path
      d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
      fill="currentColor"
    />
  </svg>
);

export const SunFilledIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <g fill="currentColor">
      <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
      <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
    </g>
  </svg>
);

export const GithubIcon: React.FC<IconSvgProps> = ({
  size = 24,
  width,
  height,
  ...props
}) => {
  return (
    <svg
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export const GoogleIcon: React.FC<IconSvgProps> = ({
  size = 24,
  width,
  height,
  ...props
}) => {
  return (
    <svg
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 16.42 6.5L19.9 3A11.97 11.97 0 0 0 1.24 6.65l4.03 3.11Z"/>
      <path fill="#34A853" d="M16.04 18.01A7.4 7.4 0 0 1 12 19.1a7.08 7.08 0 0 1-6.72-4.82l-4.04 3.06A11.96 11.96 0 0 0 12 24a11.4 11.4 0 0 0 7.83-3l-3.79-2.99Z"/><path fill="#4A90E2" d="M19.83 21c2.2-2.05 3.62-5.1 3.62-9 0-.7-.1-1.47-.27-2.18H12v4.63h6.44a5.4 5.4 0 0 1-2.4 3.56l3.8 2.99Z"/><path fill="#FBBC05" d="M5.28 14.27a7.12 7.12 0 0 1-.01-4.5L1.24 6.64A11.93 11.93 0 0 0 0 12c0 1.92.44 3.73 1.24 5.33l4.04-3.06Z"/>
    </svg>
  );
};

export const ChevronDownIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size ||width}
      height={size || height}
      viewBox="0 0 24 24"
      {...props}>
      <path
        className="fill-default-400"
        d="m6.293 10.707 1.414-1.414L12 13.586l4.293-4.293 1.414 1.414L12 16.414z"></path>
    </svg>
  );
};

export const HomeIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => {
  return (
    <svg
      width={size || width}
      height={size || height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        className="fill-default-400"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 13H10C10.55 13 11 12.55 11 12V4C11 3.45 10.55 3 10 3H4C3.45 3 3 3.45 3 4V12C3 12.55 3.45 13 4 13ZM4 21H10C10.55 21 11 20.55 11 20V16C11 15.45 10.55 15 10 15H4C3.45 15 3 15.45 3 16V20C3 20.55 3.45 21 4 21ZM14 21H20C20.55 21 21 20.55 21 20V12C21 11.45 20.55 11 20 11H14C13.45 11 13 11.45 13 12V20C13 20.55 13.45 21 14 21ZM13 4V8C13 8.55 13.45 9 14 9H20C20.55 9 21 8.55 21 8V4C21 3.45 20.55 3 20 3H14C13.45 3 13 3.45 13 4Z"
        fill="#0085FF"
      />
    </svg>
  );
};

export const QuestionIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    viewBox="0 0 1024 1024"
    height={size || height}
    width={size || width}
    {...props}
  >
    <path d="M514.048 54.272q95.232 0 178.688 36.352t145.92 98.304 98.304 145.408 35.84 178.688-35.84 178.176-98.304 145.408-145.92 98.304-178.688 35.84-178.176-35.84-145.408-98.304-98.304-145.408-35.84-178.176 35.84-178.688 98.304-145.408 145.408-98.304 178.176-36.352zM515.072 826.368q26.624 0 44.544-17.92t17.92-43.52q0-26.624-17.92-44.544t-44.544-17.92-44.544 17.92-17.92 44.544q0 25.6 17.92 43.52t44.544 17.92zM567.296 574.464q-1.024-16.384 20.48-34.816t48.128-40.96 49.152-50.688 24.576-65.024q2.048-39.936-8.192-74.752t-33.792-59.904-60.928-39.936-87.552-14.848q-62.464 0-103.936 22.016t-67.072 53.248-35.84 64.512-9.216 55.808q1.024 26.624 16.896 38.912t34.304 12.8 33.792-10.24 15.36-31.232q0-12.288 7.68-30.208t20.992-34.304 32.256-27.648 42.496-11.264q46.08 0 73.728 23.04t25.6 57.856q0 17.408-10.24 32.256t-26.112 28.672-33.792 27.648-33.792 28.672-26.624 32.256-11.776 37.888l1.024 38.912q0 15.36 14.336 29.184t37.888 14.848q23.552-1.024 37.376-15.36t12.8-32.768l0-24.576z" p-id="8237"></path>
  </svg>
)

export const MenuIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 1024 1024"
    width={size || width}
    {...props}
  >
    <path
      d="M963.764706 180.705882v120.470589H60.235294V180.705882h903.529412zM60.235294 602.352941h903.529412V481.882353H60.235294v120.470588z m0 301.176471h903.529412v-120.470588H60.235294v120.470588z"
      fill="currentColor"
    />
  </svg>
)

export const DashboardIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M3 13.5H10.5V21H3V13.5Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M13.5 3H21V10.5H13.5V3Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 3H10.5V10.5H3V3Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M13.5 13.5H21V21H13.5V13.5Z" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const PostIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M6 3.75H14.5L18.75 8V20.25H6V3.75Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14.25 3.75V8.25H18.75" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.5 11.25H16.25M8.5 14.25H16.25M8.5 17.25H13.25" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const CommentIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M4 5.25H20V15.75H9.25L4 20.25V5.25Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7.5 9H16.5M7.5 12H13.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const TagIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M3.75 10.5L10.5 3.75H18.75V12L12 18.75L3.75 10.5Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14.25 8.25C14.6642 8.25 15 7.91421 15 7.5C15 7.08579 14.6642 6.75 14.25 6.75C13.8358 6.75 13.5 7.08579 13.5 7.5C13.5 7.91421 13.8358 8.25 14.25 8.25Z" fill="currentColor" />
  </svg>
)

export const CategoryIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M3.75 3.75H10.5V10.5H3.75V3.75Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M13.5 3.75H20.25V8.25H13.5V3.75Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.75 13.5H8.25V20.25H3.75V13.5Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M11.25 11.25H20.25V20.25H11.25V11.25Z" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const UserIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 12C14.0711 12 15.75 10.3211 15.75 8.25C15.75 6.17893 14.0711 4.5 12 4.5C9.92893 4.5 8.25 6.17893 8.25 8.25C8.25 10.3211 9.92893 12 12 12Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4.5 19.5C4.5 16.6005 7.1005 14.25 12 14.25C16.8995 14.25 19.5 16.6005 19.5 19.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const LinkIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M10.5 13.5L13.5 10.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.25 15.75H6.75C5.09315 15.75 3.75 14.4069 3.75 12.75V12.75C3.75 11.0931 5.09315 9.75 6.75 9.75H8.25" stroke="currentColor" strokeWidth="1.8" />
    <path d="M15.75 9.75H17.25C18.9069 9.75 20.25 11.0931 20.25 12.75V12.75C20.25 14.4069 18.9069 15.75 17.25 15.75H15.75" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const ActivityIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 12H7.5L10.5 6L14.5 18L17.5 12H20"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const DatabaseIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <ellipse cx="12" cy="6.75" rx="7.5" ry="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4.5 6.75V12.75C4.5 14.4069 7.85786 15.75 12 15.75C16.1421 15.75 19.5 14.4069 19.5 12.75V6.75" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4.5 12.75V17.25C4.5 18.9069 7.85786 20.25 12 20.25C16.1421 20.25 19.5 18.9069 19.5 17.25V12.75" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const MediaIcon = ({ size = 20, width, height, ...props }: IconSvgProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size || width}
    height={size || height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4.5 7.5C4.5 6.67157 5.17157 6 6 6H18C18.8284 6 19.5 6.67157 19.5 7.5V16.5C19.5 17.3284 18.8284 18 18 18H6C5.17157 18 4.5 17.3284 4.5 16.5V7.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M4.5 14.25L8.25 10.5L11.25 13.5L14.25 10.5L19.5 15.75"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="9.75" r="1" fill="currentColor" />
  </svg>
)