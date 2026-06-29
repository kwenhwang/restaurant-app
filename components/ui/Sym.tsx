// components/ui/Sym.tsx
// SF Symbols-style inline SVG glyphs. Color via currentColor.
// v3: added sparkle, flame.fill, clock, link, phone.fill, location.fill,
//     square.and.arrow.up, moon.fill, sun.max.fill, checkmark, chevron.down.

type SymName =
  | "magnifyingglass" | "plus" | "chevron.right" | "chevron.left" | "chevron.down" | "ellipsis"
  | "xmark" | "mappin" | "mappin.and.ellipse" | "location.fill" | "fork.knife"
  | "star.fill" | "star" | "house" | "house.fill" | "map" | "map.fill"
  | "calendar" | "calendar.fill" | "person" | "person.fill"
  | "heart" | "heart.fill" | "bookmark" | "bookmark.fill" | "camera" | "photo"
  | "arrow.up.right" | "arrow.left" | "pencil" | "trash"
  | "plus.circle.fill" | "sparkles" | "sparkle" | "square.and.pencil"
  | "square.and.arrow.up" | "phone.fill" | "clock" | "link" | "flame.fill"
  | "checkmark" | "moon.fill" | "sun.max.fill";

type Props = {
  name: SymName;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export default function Sym({ name, size = 22, strokeWidth = 1.8, className }: Props) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor",
    strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    className,
  };
  const fp = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor" as const, className };
  switch (name) {
    case "magnifyingglass":
      return (<svg {...p}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>);
    case "plus":
      return (<svg {...p}><path d="M12 5v14M5 12h14"/></svg>);
    case "chevron.right":
      return (<svg {...p} strokeWidth={2.2}><path d="M9 5l7 7-7 7"/></svg>);
    case "chevron.left":
      return (<svg {...p} strokeWidth={2.2}><path d="M15 5l-7 7 7 7"/></svg>);
    case "chevron.down":
      return (<svg {...p} strokeWidth={2.2}><path d="M5 9l7 7 7-7"/></svg>);
    case "ellipsis":
      return (<svg {...fp}><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>);
    case "xmark":
      return (<svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>);
    case "mappin":
      return (<svg {...p}><path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.4" fill="currentColor" stroke="none"/></svg>);
    case "mappin.and.ellipse":
      return (<svg {...p}><path d="M12 13.5a3 3 0 100-6 3 3 0 000 6z"/><path d="M12 13.5V19" strokeDasharray="0.6 2"/><ellipse cx="12" cy="19.5" rx="5" ry="1.2"/></svg>);
    case "location.fill":
      return (<svg {...fp}><path d="M21 3L3 10.5l7.5 2.5 2.5 7.5L21 3z"/></svg>);
    case "fork.knife":
      return (<svg {...p}><path d="M7 3v18M5 3v6a2 2 0 002 2h0a2 2 0 002-2V3"/><path d="M17 3c-2 0-3 2-3 5s1 4 3 4v9"/></svg>);
    case "star.fill":
      return (<svg {...fp}><path d="M12 2.5l2.95 6.34 6.85.78-5.1 4.78 1.4 6.83L12 17.86l-6.1 3.37 1.4-6.83-5.1-4.78 6.85-.78L12 2.5z"/></svg>);
    case "star":
      return (<svg {...p}><path d="M12 2.5l2.95 6.34 6.85.78-5.1 4.78 1.4 6.83L12 17.86l-6.1 3.37 1.4-6.83-5.1-4.78 6.85-.78L12 2.5z"/></svg>);
    case "house.fill":
      return (<svg {...fp}><path d="M3 11.5L12 4l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-4V15h-7v6.5h-4A1.5 1.5 0 013 20v-8.5z"/></svg>);
    case "house":
      return (<svg {...p}><path d="M3 11.5L12 4l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-4V15h-7v6.5h-4A1.5 1.5 0 013 20v-8.5z"/></svg>);
    case "map":
      return (<svg {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>);
    case "map.fill":
      return (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={0.5} className={className}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 1.5l6 2v11l-6-2v-11z"/></svg>);
    case "calendar":
      return (<svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/></svg>);
    case "calendar.fill":
      return (<svg {...fp}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/><path d="M3.5 10h17" stroke="var(--surface)" strokeWidth={1.2}/></svg>);
    case "person":
      return (<svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>);
    case "person.fill":
      return (<svg {...fp}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6z"/></svg>);
    case "heart":
      return (<svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.7A4 4 0 0119 10c0 5.5-7 10-7 10z"/></svg>);
    case "heart.fill":
      return (<svg {...fp}><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.7A4 4 0 0119 10c0 5.5-7 10-7 10z"/></svg>);
    case "bookmark":
      return (<svg {...p}><path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z"/></svg>);
    case "bookmark.fill":
      return (<svg {...fp}><path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z"/></svg>);
    case "camera":
      return (<svg {...p}><path d="M3.5 8.5h3.2l1.5-2.5h7.6l1.5 2.5h3.2v10.5h-17V8.5z"/><circle cx="12" cy="13.5" r="3.4"/></svg>);
    case "photo":
      return (<svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-9 8.5"/></svg>);
    case "arrow.up.right":
      return (<svg {...p}><path d="M7 17L17 7M9 7h8v8"/></svg>);
    case "arrow.left":
      return (<svg {...p}><path d="M11 5l-7 7 7 7M4 12h16"/></svg>);
    case "pencil":
      return (<svg {...p}><path d="M4 20l4-1L20 7l-3-3L5 16l-1 4z"/></svg>);
    case "trash":
      return (<svg {...p}><path d="M5 7h14M10 7V4.5h4V7M6.5 7l1 13.5h9l1-13.5"/></svg>);
    case "plus.circle.fill":
      return (<svg width={size} height={size} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 7v10M7 12h10" stroke="var(--surface)" strokeWidth={2.2} strokeLinecap="round"/></svg>);
    case "sparkles":
      return (<svg {...p}><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8"/></svg>);
    case "sparkle":
      return (<svg {...fp}><path d="M12 2l1.6 6.1L20 10l-6.4 1.9L12 18l-1.6-6.1L4 10l6.4-1.9L12 2z"/></svg>);
    case "square.and.pencil":
      return (<svg {...p}><path d="M19 12v7a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h7"/><path d="M16 4l4 4-9 9H7v-4l9-9z"/></svg>);
    case "square.and.arrow.up":
      return (<svg {...p}><path d="M12 15V4M12 4L8.5 7.5M12 4l3.5 3.5"/><path d="M6 11.5v7a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-7"/></svg>);
    case "phone.fill":
      return (<svg {...fp}><path d="M6.6 3.5c.6 0 1.1.4 1.3 1l.9 3a1.4 1.4 0 01-.4 1.5L7 10.3a12 12 0 005.6 5.6l1.3-1.4c.4-.4 1-.5 1.5-.4l3 .9c.6.2 1 .7 1 1.3v3c0 .9-.7 1.6-1.6 1.5C9.7 20.4 3.6 14.3 3.1 5.1A1.5 1.5 0 014.6 3.5z"/></svg>);
    case "clock":
      return (<svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>);
    case "link":
      return (<svg {...p}><path d="M9 15l6-6"/><path d="M11 7l1-1a4 4 0 015.6 5.6l-2 2"/><path d="M13 17l-1 1a4 4 0 01-5.6-5.6l2-2"/></svg>);
    case "flame.fill":
      return (<svg {...fp}><path d="M12 2c1 3-2 4-2 7 0 1.3 1 2.4 2 2.4 1.6 0 2.4-1.2 2.4-2.6 2 1.4 3.6 3.5 3.6 6.2A6 6 0 1 1 6 14c0-3 2.5-4.5 3.2-7.3C9.7 4.8 11 3.3 12 2z"/></svg>);
    case "checkmark":
      return (<svg {...p} strokeWidth={2.4}><path d="M5 12.5l4.2 4.2L19 6.5"/></svg>);
    case "moon.fill":
      return (<svg {...fp}><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></svg>);
    case "sun.max.fill":
      return (<svg {...fp}><circle cx="12" cy="12" r="4.6"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>);
    default:
      return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="3"/></svg>;
  }
}
