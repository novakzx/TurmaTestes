/** Ícones SVG inline (traço 2px, currentColor) — sem dependências externas. */

const Svg = ({ size = 22, children, fill = 'none', ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {children}
  </svg>
);

export const IconHome = (p) => <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></Svg>;
export const IconCalendar = (p) => <Svg {...p}><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></Svg>;
export const IconBook = (p) => <Svg {...p}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 20.5z" /><path d="M9 7h7M9 11h5" /></Svg>;
export const IconChat = (p) => <Svg {...p}><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" /></Svg>;
export const IconUser = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></Svg>;
export const IconBell = (p) => <Svg {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7.5-3 9h18c0-1.5-3-2-3-9" /><path d="M10.3 21a2 2 0 0 0 3.4 0" /></Svg>;
export const IconHeart = (p) => <Svg {...p}><path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.8 4c1.8 0 3.3.9 4.2 2.4C12.9 4.9 14.4 4 16.2 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" /></Svg>;
export const IconComment = (p) => <Svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.4A8 8 0 1 1 21 12z" /><path d="M9 11h6M9 14.5h4" /></Svg>;
export const IconBookmark = (p) => <Svg {...p}><path d="M6 3.5h12v17l-6-4.5-6 4.5z" /></Svg>;
export const IconPlus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></Svg>;
export const IconSettings = (p) => <Svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.05.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .33-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 8.9a1.7 1.7 0 0 0-.33-1.88l-.06-.05a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.33h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.05-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.33 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" /></Svg>;
export const IconLogout = (p) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></Svg>;
export const IconCheck = (p) => <Svg {...p}><path d="m4.5 12.5 5 5L19.5 7" /></Svg>;
export const IconX = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const IconChevronLeft = (p) => <Svg {...p}><path d="m14.5 5-7 7 7 7" /></Svg>;
export const IconChevronRight = (p) => <Svg {...p}><path d="m9.5 5 7 7-7 7" /></Svg>;
export const IconChevronDown = (p) => <Svg {...p}><path d="m5 9 7 7 7-7" /></Svg>;
export const IconSend = (p) => <Svg {...p}><path d="M21.5 2.5 11 13M21.5 2.5l-7 19-3.5-8-8-3.5z" /></Svg>;
export const IconLock = (p) => <Svg {...p}><rect x="4.5" y="10.5" width="15" height="10.5" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></Svg>;
export const IconTrash = (p) => <Svg {...p}><path d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5 7.5 21h9l1-14.5M10 10.5v7M14 10.5v7" /></Svg>;
export const IconEdit = (p) => <Svg {...p}><path d="M4 20h4L20 8l-4-4L4 16z" /><path d="m14.5 5.5 4 4" /></Svg>;
export const IconDownload = (p) => <Svg {...p}><path d="M12 3v12m0 0 5-5m-5 5-5-5" /><path d="M4 17.5V21h16v-3.5" /></Svg>;
export const IconSun = (p) => <Svg {...p}><circle cx="12" cy="12" r="4.5" /><path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" /></Svg>;
export const IconMoon = (p) => <Svg {...p}><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" /></Svg>;
export const IconMapPin = (p) => <Svg {...p}><path d="M20 10.5c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" /><circle cx="12" cy="10.5" r="3" /></Svg>;
export const IconFlag = (p) => <Svg {...p}><path d="M5 21V4M5 5h11l-2 3.5L16 12H5" /></Svg>;
export const IconCap = (p) => <Svg {...p}><path d="m12 3.5 10 5-10 5L2 8.5z" /><path d="M6.5 10.8V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-5.2M21 9v6" /></Svg>;
export const IconRefresh = (p) => <Svg {...p}><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1M20.5 4v5h-5" /></Svg>;
export const IconAlert = (p) => <Svg {...p}><path d="M12 3 1.5 21h21z" /><path d="M12 9.5v5.5M12 18h.01" /></Svg>;
export const IconWifiOff = (p) => <Svg {...p}><path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4-2.4M19 12.9a10 10 0 0 0-8-2.8M2.5 8.9A15 15 0 0 1 9 5.6M21.5 8.9a15 15 0 0 0-5.4-3M12 20.5h.01" /></Svg>;
export const IconPoll = (p) => <Svg {...p}><path d="M6 20V13M12 20V6M18 20v-9M3 20.5h18" /></Svg>;
export const IconCalc = (p) => <Svg {...p}><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v4M8 18.5h4" /></Svg>;
export const IconTarget = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></Svg>;
export const IconClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.5l3.5 2" /></Svg>;
export const IconUsers = (p) => <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20.5c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M17.5 15.8c2 .7 3.3 2.2 4 4.7" /></Svg>;
export const IconShare = (p) => <Svg {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" /></Svg>;
export const IconEye = (p) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></Svg>;
export const IconShield = (p) => <Svg {...p}><path d="M12 2.5 20 6v6c0 5-3.5 8-8 9.5C7.5 20 4 17 4 12V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></Svg>;

export const FILLED = { fill: 'currentColor' };
