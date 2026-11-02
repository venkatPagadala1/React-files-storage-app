import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faBuilding,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faChalkboard,
  faCircleUser,
  faFileLines,
  faFolder,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

const navigationItems = [
  { area: "company", feature: "company", label: "Overview", icon: faBuilding },
  { area: "company-resources", feature: "company-resources", label: "Resources", icon: faFolder },
  { area: "employee", feature: "employee", label: "Documents", icon: faFileLines },
  { area: "training", feature: "training", label: "Learning", icon: faBookOpen },
  { area: "calendar", feature: "calendar", label: "Calendar", icon: faCalendarDays },
  { area: "whiteboard", feature: "whiteboard", label: "Whiteboard", icon: faChalkboard },
  { area: "profile", feature: "profile", label: "Profile", icon: faCircleUser },
  { area: "team-admin", feature: "manage-team", label: "Team", icon: faUserShield },
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
    <nav className="workspace-bottom-nav" aria-label="Workspace page navigation">
      <button
        type="button"
        className="workspace-bottom-nav-step"
        onClick={() => navigateToItem(previousItem)}
        disabled={!previousItem}
        aria-label={previousItem ? `Previous page: ${previousItem.label}` : "No previous page"}
        title={previousItem ? `Previous: ${previousItem.label}` : "No previous page"}
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <div className="workspace-bottom-nav-items">
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
              className={`workspace-bottom-nav-item${isActive ? " is-active" : ""}`}
              onClick={handleClick}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              title={label}
            >
              <FontAwesomeIcon icon={icon} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="workspace-bottom-nav-step"
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
