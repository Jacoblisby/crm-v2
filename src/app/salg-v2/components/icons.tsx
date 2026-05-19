/**
 * Icons — inline SVG fra handoff. 24x24 viewBox, 1.8 stroke, round caps.
 */

interface IconProps {
  name: string;
  color?: string;
  size?: number;
}

export function RoomIcon({ name, color = 'currentColor', size = 16 }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '1.8',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'kitchen':
      return (
        <svg {...p}>
          <path d="M6 13a4 4 0 0 1-1-7.8 5 5 0 0 1 9.5-1.5 4 4 0 0 1 4.5 5.3A4 4 0 0 1 18 13M6 13v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6M6 13h12" />
        </svg>
      );
    case 'bath':
      return (
        <svg {...p}>
          <path d="M3 11h18M5 11V7a3 3 0 0 1 6 0M7 17v2M11 17v2M15 17v2M19 17v2M5 11v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case 'sofa':
      return (
        <svg {...p}>
          <path d="M3 18v-7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7M3 18l1 2M21 18l-1 2M3 12h18M7 18v3M17 18v3" />
        </svg>
      );
    case 'bed':
      return (
        <svg {...p}>
          <path d="M3 18v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M3 18h18M3 18v2M21 18v2M7 12h4v2H7z" />
        </svg>
      );
    case 'details':
      return (
        <svg {...p}>
          <path d="M3 9l9-7 9 7M5 9v11h14V9M9 20v-6h6v6" />
        </svg>
      );
    case 'coin':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9.5C9 8 10 7 12 7s3 1 3 2.5S13 11 12 11s-3 .5-3 2 1 2.5 3 2.5 3-1 3-2.5M12 5v14" />
        </svg>
      );
    case 'user':
      return (
        <svg {...p}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'home':
      return (
        <svg {...p}>
          <path d="M3 9l9-7 9 7M5 9v11h14V9" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...p}>
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      );
    default:
      return null;
  }
}

export function MiniIcon({ name, color = '#5A6166', size = 14 }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '1.8',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home': return <svg {...p}><path d="M3 9l9-7 9 7M5 9v11h14V9" /></svg>;
    case 'arrows': return <svg {...p}><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" /></svg>;
    case 'sun': return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></svg>;
    case 'users': return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /><circle cx="9" cy="7" r="4" /></svg>;
    case 'warn': return <svg {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>;
    case 'wrench': return <svg {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
    case 'doc': return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case 'view': return <svg {...p}><path d="M3 18l4-6 4 4 5-7 5 9" /><path d="M3 21h18" /></svg>;
    case 'plan': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 12h18M12 3v18" /></svg>;
    case 'door': return <svg {...p}><path d="M6 3h12v18H6zM10 12h.01" /></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'bolt': return <svg {...p}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>;
    case 'cal1': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 16h2v2H8z" /></svg>;
    case 'cal2': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 16h8" /></svg>;
    case 'cal3': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M7 14h10M7 18h7" /></svg>;
    case 'q': return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>;
    case 'heart': return <svg {...p}><path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 0 0-7.78 7.78l1.06 1.07L12 21.23l7.78-7.78 1.06-1.07a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case 'split': return <svg {...p}><path d="M16 3h5v5M4 20l16.5-16.5M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>;
    case 'coin2': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9 9.5C9 8 10 7 12 7s3 1 3 2.5S13 11 12 11s-3 .5-3 2 1 2.5 3 2.5 3-1 3-2.5M12 5v14" /></svg>;
    case 'trending': return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    case 'paw': return <svg {...p}><circle cx="8" cy="9" r="2" /><circle cx="16" cy="9" r="2" /><circle cx="6" cy="14" r="2" /><circle cx="18" cy="14" r="2" /><path d="M9 19a3 3 0 0 1 6 0v0a3 3 0 0 1-6 0z" /></svg>;
    case 'train': return <svg {...p}><rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16M8 15h.01M16 15h.01M9 19l-2 2M15 19l2 2" /></svg>;
    case 'school': return <svg {...p}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5a6 3 0 0 0 12 0v-5M22 9v6" /></svg>;
    case 'sofa': return <svg {...p}><path d="M3 18v-7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7M3 18l1 2M21 18l-1 2M3 12h18M7 18v3M17 18v3" /></svg>;
    case 'car': return <svg {...p}><path d="M5 17h14M3 17v-5l2-5h14l2 5v5M5 17v2h2v-2M17 17v2h2v-2" /><circle cx="7.5" cy="13.5" r="1" /><circle cx="16.5" cy="13.5" r="1" /></svg>;
    case 'info': return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>;
    case 'arrow': return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
    default: return null;
  }
}

export function StatIcon({ name, color }: { name: string; color: string }) {
  const p = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '1.8',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'building':
      return <svg {...p}><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>;
    case 'savings':
      return <svg {...p}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case 'clock':
      return <svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case 'shield':
      return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
    default:
      return null;
  }
}
