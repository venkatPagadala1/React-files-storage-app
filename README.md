# VSR Group of Companies Workspace

A React and Vite UI prototype for a shared company overview and employee preparation workspace. Its responsive interface uses grouped, role-aware navigation, a consistent typography and spacing system, and rounded palette-aware animated gradient frames with subtle depth. The outer landing and workspace borders have a multicolor gradient and a bright moving highlight that travels around the frame continuously and responds to page scroll, while prominent cards respond to their own scroll position. Edge animations respect the operating system's reduced-motion preference. The prototype includes a dimensional V/R brand mark, sample company-resource and training views with expandable learning paths and locally saved course links (including full-view details and edit/save controls), a visual-only role preview, employee documents and notes, a preparation calendar with event comments, a local demo profile with an optional profile photo, preparation boards, and an interactive whiteboard with drawing and shape tools, image placement, object layers, undo/redo, and SVG/PNG export.

## Development

- `npm run dev` starts the local development server.
- `npm run build` creates the production bundle.
- `npm run lint` checks the source code.

## Prototype and security status

This is a UI prototype, not a secure employee portal. Sign-in and sign-up are mock flows: any syntactically valid email and non-empty password are accepted, and no credentials or accounts are sent or saved. Never enter a real or reused password. The role selector only changes the preview label; it does not enforce permissions. Company-resource cards, team profiles, and company metrics are illustrative sample data.

The employee workspace stores folders, notes, and uploaded files in browser-local IndexedDB. The standalone whiteboard (including inserted images), preparation calendar events and comments, demo profile (including an optional resized profile photo), and learning-path course links are stored in browser localStorage. Whiteboard images are resized and stored in the browser with the board; boards can be exported as SVG or PNG. Learning resources can be viewed in a detail dialog, edited, and saved locally. These data are not encrypted, shared between team members, or backed up. There is no real account authentication, server-enforced authorization, private company storage, audit log, or access control. Do not store confidential company or employee information. Calendar comments and learning resources demonstrate the intended collaboration UI only; each browser has its own local copy.

Before using this with employees or real documents, implement and validate a backend with authentication, server-side role and company-boundary authorization, private encrypted storage, audit logging, backup and retention policies, and secure file handling. The UI role preview must not be treated as a security control.
