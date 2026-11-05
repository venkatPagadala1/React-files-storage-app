import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faChalkboard,
  faCircleUser,
  faFileLines,
  faNoteSticky,
} from "@fortawesome/free-solid-svg-icons";

const navigationItems = [
  { area: "company", feature: "company", label: "Overview", icon: faBuilding },
  { area: "employee", feature: "employee", label: "Documents", icon: faFileLines },
  { area: "sticky-notes", feature: "sticky-notes", label: "Tasks", icon: faNoteSticky },
  { area: "calendar", feature: "calendar", label: "Calendar", icon: faCalendarDays },
  { area: "whiteboard", feature: "whiteboard", label: "Whiteboard", icon: faChalkboard },
  { area: "profile", feature: "profile", label: "Profile", icon: faCircleUser },
];

function WorkspaceBottomNav({
  activeArea,
  isBoardOpen,
  roleFeatures,
  onNavigate,
  onOpenBoard,
}) {
  const visibleItems = navigationItems.filter(({ feature }) => roleFeatures.includes(feature));
  const activeIndex = visibleItems.findIndex(({ area }) =>
    area === "whiteboard" ? isBoardOpen : !isBoardOpen && activeArea === area,
  );
  const navigateToItem = (item) => {
    if (!item) return;
    if (item.area === "whiteboard") {
      onOpenBoard();
      return;
    }
    onNavigate(item.area);
  };
  const previousItem = activeIndex > 0 ? visibleItems[activeIndex - 1] : null;
  const nextItem = activeIndex >= 0 ? visibleItems[activeIndex + 1] : visibleItems[0];

  return (
    <nav
      className="workspace-bottom-nav fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-20 m-0 flex w-[min(760px,calc(100%-32px))] -translate-x-1/2 gap-0.5 rounded-[17px] border border-transparent p-0.5 backdrop-blur-[18px]"
      aria-label="Workspace page navigation"
    >
      <button
        type="button"
        className="workspace-bottom-nav-step grid h-11 min-h-11 w-8 min-w-8 flex-[0_0_32px] place-items-center rounded-xl border-0 bg-transparent text-[var(--workspace-muted)] transition-colors duration-150 hover:bg-[var(--workspace-accent-soft)] hover:text-[var(--workspace-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--workspace-accent)] focus-visible:-outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => navigateToItem(previousItem)}
        disabled={!previousItem}
        aria-label={previousItem ? `Previous page: ${previousItem.label}` : "No previous page"}
        title={previousItem ? `Previous: ${previousItem.label}` : "No previous page"}
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <div className="workspace-bottom-nav-items flex min-w-0 flex-[1_1_auto] items-stretch justify-center gap-[3px] overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [scrollbar-color:color-mix(in_srgb,var(--workspace-accent)_48%,transparent)_transparent]">
        {visibleItems.map(({ area, label, icon }) => {
          const isBoard = area === "whiteboard";
          const isActive = isBoard ? isBoardOpen : !isBoardOpen && activeArea === area;
          const handleClick = isBoard
            ? onOpenBoard
            : () => onNavigate(area);

          return (
            <button
              key={area}
              type="button"
              className={`workspace-bottom-nav-item grid min-h-[52px] min-w-16 flex-[1_0_auto] content-center justify-items-center gap-[3px] rounded-xl border-0 bg-transparent px-[7px] py-[6px] text-[0.66rem] font-[650] text-[var(--workspace-muted)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--workspace-accent-soft)] hover:text-[var(--workspace-accent)] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--workspace-accent)] focus-visible:-outline-offset-[3px] [&_svg]:text-[0.95rem]${isActive ? " is-active bg-[color-mix(in_srgb,var(--workspace-accent)_13%,var(--ui-surface))] text-[var(--workspace-accent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--workspace-accent)_24%,transparent)]" : ""}`}
              onClick={handleClick}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              title={label}
            >
              <span className="workspace-bottom-nav-icon">
                <FontAwesomeIcon icon={icon} />
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="workspace-bottom-nav-step grid h-11 min-h-11 w-8 min-w-8 flex-[0_0_32px] place-items-center rounded-xl border-0 bg-transparent text-[var(--workspace-muted)] transition-colors duration-150 hover:bg-[var(--workspace-accent-soft)] hover:text-[var(--workspace-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--workspace-accent)] focus-visible:-outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => navigateToItem(nextItem)}
        disabled={!nextItem}
        aria-label={nextItem ? `Next page: ${nextItem.label}` : "No next page"}
        title={nextItem ? `Next: ${nextItem.label}` : "No next page"}
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </nav>
  );
}

export default WorkspaceBottomNav;
