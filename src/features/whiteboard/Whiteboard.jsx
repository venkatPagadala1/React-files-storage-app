import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowPointer,
  faArrowRight,
  faChalkboard,
  faCheck,
  faCircle,
  faCircleInfo,
  faDownload,
  faEraser,
  faExpand,
  faFont,
  faHand,
  faHighlighter,
  faLayerGroup,
  faMinus,
  faPen,
  faPlus,
  faLock,
  faRotateLeft,
  faRotateRight,
  faSquare,
  faStickyNote,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { createId } from "../../lib/workspaceUtils.js";

const STORAGE_KEY = "vsr-workspace-whiteboard-v1";
const COLORS = ["#172033", "#f15b62", "#f59e0b", "#25a66a", "#4385f5", "#a855e8", "#eb4c9b", "#ffffff"];
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;
const TOOLS = [
  { id: "select", label: "Select", icon: faArrowPointer, shortcut: "V" },
  { id: "hand", label: "Move canvas", icon: faHand, shortcut: "H" },
  { id: "pen", label: "Pen", icon: faPen, shortcut: "P" },
  { id: "highlighter", label: "Highlighter", icon: faHighlighter },
  { id: "eraser", label: "Eraser", icon: faEraser, shortcut: "E" },
  { id: "sticky", label: "Sticky note", icon: faStickyNote, shortcut: "N" },
  { id: "text", label: "Text", icon: faFont, shortcut: "T" },
  { id: "rectangle", label: "Rectangle", icon: faSquare },
  { id: "ellipse", label: "Ellipse", icon: faCircle },
  { id: "arrow", label: "Arrow", icon: faArrowRight },
];

const INITIAL_BOARD = {
  title: "Untitled board",
  background: "dots",
  objects: [],
};

function readBoard() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...INITIAL_BOARD, objects: [], message: "" };
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.objects)) {
      throw new Error("The saved board data is not valid.");
    }
    return {
      title: typeof parsed.title === "string" ? parsed.title : INITIAL_BOARD.title,
      background: ["dots", "grid", "plain"].includes(parsed.background)
        ? parsed.background
        : INITIAL_BOARD.background,
      objects: parsed.objects,
      message: "",
    };
  } catch (error) {
    console.error("Could not load the saved whiteboard.", error);
    return {
      ...INITIAL_BOARD,
      objects: [],
      message: "Your saved board could not be loaded. A blank board is open.",
    };
  }
}

function pointerPosition(event, pan, zoom, canvas = event.currentTarget) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) * 1600 / bounds.width - pan.x) / zoom,
    y: ((event.clientY - bounds.top) * 1000 / bounds.height - pan.y) / zoom,
  };
}

function svgEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function WhiteboardObject({
  object,
  isSelected,
  onPointerDown,
  onErase,
  onTextChange,
}) {
  const commonProps = {
    onPointerDown: (event) => onPointerDown(event, object),
    onDoubleClick:
      object.type === "text" || object.type === "sticky"
        ? () => {
            const value = window.prompt(
              object.type === "sticky" ? "Edit sticky note" : "Edit text",
              object.text,
            );
            if (value !== null) onTextChange(object.id, value);
          }
        : undefined,
    onContextMenu: (event) => {
      event.preventDefault();
      onErase(object.id);
    },
    style: { cursor: "inherit" },
  };

  if (object.type === "stroke") {
    return (
      <path
        {...commonProps}
        transform={`translate(${object.x ?? 0} ${object.y ?? 0})`}
        d={object.path}
        fill="none"
        stroke={object.color}
        strokeWidth={object.width}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={object.opacity}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  if (object.type === "rectangle") {
    return (
      <rect
        {...commonProps}
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rx="8"
        fill="transparent"
        stroke={object.color}
        strokeWidth={object.strokeWidth ?? 3}
        strokeDasharray={object.dashed ? "8 6" : undefined}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  if (object.type === "ellipse") {
    return (
      <ellipse
        {...commonProps}
        cx={object.x + object.width / 2}
        cy={object.y + object.height / 2}
        rx={Math.max(1, Math.abs(object.width / 2))}
        ry={Math.max(1, Math.abs(object.height / 2))}
        fill="transparent"
        stroke={object.color}
        strokeWidth={object.strokeWidth ?? 3}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  if (object.type === "arrow") {
    const angle = Math.atan2(object.endY - object.y, object.endX - object.x);
    const headLength = 14;
    const startX = object.endX - headLength * Math.cos(angle - Math.PI / 6);
    const startY = object.endY - headLength * Math.sin(angle - Math.PI / 6);
    const otherX = object.endX - headLength * Math.cos(angle + Math.PI / 6);
    const otherY = object.endY - headLength * Math.sin(angle + Math.PI / 6);
    return (
      <g {...commonProps} fill="none" stroke={object.color} strokeWidth="3" strokeLinecap="round">
        <path d={`M ${object.x} ${object.y} L ${object.endX} ${object.endY}`} />
        <path d={`M ${startX} ${startY} L ${object.endX} ${object.endY} L ${otherX} ${otherY}`} />
      </g>
    );
  }

  if (object.type === "text") {
    return (
      <g {...commonProps}>
        <text
          x={object.x}
          y={object.y}
          fill={object.color}
          fontSize={object.fontSize ?? 24}
          fontWeight="600"
          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        >
          {(object.text || "Double-click to edit").split("\n").map((line, index) => (
            <tspan key={`${object.id}-${index}`} x={object.x} dy={index === 0 ? 0 : 30}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  if (object.type === "sticky") {
    return (
      <g {...commonProps}>
        <rect
          x={object.x}
          y={object.y}
          width="220"
          height="180"
          rx="12"
          fill={object.color}
          stroke={isSelected ? "#4585f5" : "rgba(35,45,65,.08)"}
          strokeWidth={isSelected ? 2 : 1}
          filter="drop-shadow(0 8px 14px rgba(37,47,68,.14))"
        />
        <path
          d={`M ${object.x + 185} ${object.y} L ${object.x + 220} ${object.y + 35} L ${object.x + 220} ${object.y + 12} Q ${object.x + 220} ${object.y} ${object.x + 208} ${object.y} Z`}
          fill="rgba(255,255,255,.32)"
        />
        <foreignObject
          x={object.x + 15}
          y={object.y + 25}
          width="190"
          height="140"
          style={{ overflow: "visible" }}
          onPointerDown={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <textarea
            className="whiteboard-sticky-input"
            aria-label="Sticky note text"
            value={object.text}
            placeholder="Write an idea…"
            onChange={(event) => onTextChange(object.id, event.target.value)}
          />
        </foreignObject>
      </g>
    );
  }

  return null;
}

function makeExportSvg(objects, title) {
  const content = objects.map((object) => {
    if (object.type === "stroke") {
      return `<path transform="translate(${object.x ?? 0} ${object.y ?? 0})" d="${svgEscape(object.path)}" fill="none" stroke="${svgEscape(object.color)}" stroke-width="${object.width}" stroke-linecap="round" stroke-linejoin="round" opacity="${object.opacity}"/>`;
    }
    if (object.type === "rectangle") {
      return `<rect x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" rx="8" fill="none" stroke="${svgEscape(object.color)}" stroke-width="${object.strokeWidth ?? 3}"/>`;
    }
    if (object.type === "ellipse") {
      return `<ellipse cx="${object.x + object.width / 2}" cy="${object.y + object.height / 2}" rx="${Math.abs(object.width / 2)}" ry="${Math.abs(object.height / 2)}" fill="none" stroke="${svgEscape(object.color)}" stroke-width="${object.strokeWidth ?? 3}"/>`;
    }
    if (object.type === "arrow") {
      return `<path d="M ${object.x} ${object.y} L ${object.endX} ${object.endY}" fill="none" stroke="${svgEscape(object.color)}" stroke-width="3" marker-end="url(#arrowhead)"/>`;
    }
    if (object.type === "sticky") {
      const lines = String(object.text || "").split("\n");
      const text = lines
        .map((line, index) => `<tspan x="${object.x + 16}" dy="${index === 0 ? 0 : 22}">${svgEscape(line)}</tspan>`)
        .join("");
      return `<rect x="${object.x}" y="${object.y}" width="220" height="180" rx="12" fill="${svgEscape(object.color)}"/><text x="${object.x + 16}" y="${object.y + 40}" fill="#243047" font-family="sans-serif" font-size="16">${text}</text>`;
    }
    if (object.type === "text") {
      const text = String(object.text || "")
        .split("\n")
        .map((line, index) => `<tspan x="${object.x}" dy="${index === 0 ? 0 : 30}">${svgEscape(line)}</tspan>`)
        .join("");
      return `<text x="${object.x}" y="${object.y}" fill="${svgEscape(object.color)}" font-family="sans-serif" font-size="${object.fontSize ?? 24}" font-weight="600">${text}</text>`;
    }
    return "";
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100"><title>${svgEscape(title)}</title><defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#334155"/></marker></defs><rect width="100%" height="100%" fill="white"/>${content}</svg>`;
}

function Whiteboard({ onClose, theme }) {
  const [initialBoard] = useState(readBoard);
  const [title, setTitle] = useState(initialBoard.title);
  const [objects, setObjects] = useState(initialBoard.objects);
  const [background, setBackground] = useState(initialBoard.background);
  const [storageMessage, setStorageMessage] = useState(initialBoard.message);
  const [tool, setTool] = useState("select");
  const [color, setColor] = useState(COLORS[1]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [opacity, setOpacity] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [historyAvailability, setHistoryAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [draft, setDraft] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const canvasRef = useRef(null);
  const gestureRef = useRef(null);
  const historyRef = useRef({ past: [], future: [] });
  const objectsRef = useRef(objects);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    function handleStorageError(event) {
      setStorageMessage(event.detail);
    }

    window.addEventListener("whiteboard-storage-error", handleStorageError);
    return () => window.removeEventListener("whiteboard-storage-error", handleStorageError);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ title, background, objects }),
      );
    } catch (error) {
      console.error("Could not save the whiteboard.", error);
      window.dispatchEvent(
        new CustomEvent("whiteboard-storage-error", {
          detail: "Could not save this board on this device.",
        }),
      );
    }
  }, [title, background, objects]);

  function pushHistory(previous = objectsRef.current) {
    historyRef.current.past = [...historyRef.current.past, previous].slice(-60);
    historyRef.current.future = [];
    setHistoryAvailability({ canUndo: true, canRedo: false });
  }

  function commit(nextObjects) {
    pushHistory();
    objectsRef.current = nextObjects;
    setObjects(nextObjects);
  }

  function undo() {
    const history = historyRef.current.past;
    if (history.length === 0) return;
    const previous = history.at(-1);
    historyRef.current.past = history.slice(0, -1);
    historyRef.current.future = [...historyRef.current.future, objectsRef.current];
    setHistoryAvailability({
      canUndo: history.length > 1,
      canRedo: true,
    });
    objectsRef.current = previous;
    setObjects(previous);
    setSelectedId(null);
  }

  function redo() {
    const future = historyRef.current.future;
    if (future.length === 0) return;
    const next = future.at(-1);
    historyRef.current.future = future.slice(0, -1);
    historyRef.current.past = [...historyRef.current.past, objectsRef.current];
    setHistoryAvailability({
      canUndo: true,
      canRedo: future.length > 1,
    });
    objectsRef.current = next;
    setObjects(next);
    setSelectedId(null);
  }

  function removeSelected() {
    if (!selectedId) return;
    commit(objectsRef.current.filter((object) => object.id !== selectedId));
    setSelectedId(null);
  }

  useEffect(() => {
    function handleKeys(event) {
      const target = event.target;
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (isEditing) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === "Escape") setSelectedId(null);
      if (event.key === "Delete" || event.key === "Backspace") removeSelected();
      const shortcut = TOOLS.find(
        (candidate) => candidate.shortcut?.toLowerCase() === event.key.toLowerCase(),
      );
      if (shortcut) setTool(shortcut.id);
    }

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  });

  function addTextObject(position, type = tool) {
    const isSticky = type === "sticky";
    const object = {
      id: createId(),
      type: isSticky ? "sticky" : "text",
      x: position.x,
      y: position.y,
      color: isSticky ? "#fff0a8" : color,
      text: isSticky ? "" : "Double-click to edit",
      ...(isSticky ? {} : { fontSize: Math.max(18, strokeWidth * 6) }),
    };
    commit([...objectsRef.current, object]);
    setSelectedId(object.id);
    setTool("select");
  }

  function handleCanvasPointerDown(event) {
    if (event.button !== 0 && event.button !== 1) return;
    const position = pointerPosition(event, pan, zoom);
    const shouldPan = tool === "hand" || event.button === 1;
    if (shouldPan) {
      gestureRef.current = {
        type: "pan",
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPan: pan,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (tool === "sticky" || tool === "text") {
      addTextObject(position);
      return;
    }
    if (tool === "select") {
      setSelectedId(null);
      return;
    }

    const type = tool === "highlighter" ? "stroke" : tool;
    const point = { x: position.x, y: position.y };
    gestureRef.current = {
      type: "draw",
      tool,
      start: point,
      current: point,
      points: [point],
    };
    if (tool === "pen" || tool === "highlighter") {
      setDraft({
        type: "stroke",
        path: `M ${point.x} ${point.y}`,
        color,
        width: tool === "highlighter" ? strokeWidth * 3 : strokeWidth,
        opacity: (tool === "highlighter" ? 0.3 : 1) * opacity / 100,
      });
    } else {
      setDraft({
        type,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        endX: point.x,
        endY: point.y,
        color,
        strokeWidth,
        opacity: opacity / 100,
      });
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerMove(event) {
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (gesture.type === "pan") {
      const bounds = canvasRef.current?.getBoundingClientRect();
      if (!bounds) return;
      setPan({
        x: gesture.startPan.x + (event.clientX - gesture.startClientX) * 1600 / bounds.width,
        y: gesture.startPan.y + (event.clientY - gesture.startClientY) * 1000 / bounds.height,
      });
      return;
    }
    const position = pointerPosition(event, pan, zoom);
    gesture.current = position;
    if (gesture.type !== "draw") return;
    if (gesture.tool === "pen" || gesture.tool === "highlighter") {
      gesture.points.push(position);
      setDraft((current) => ({
        ...current,
        path: `${current.path} L ${position.x} ${position.y}`,
      }));
      return;
    }

    const left = Math.min(gesture.start.x, position.x);
    const top = Math.min(gesture.start.y, position.y);
    const width = Math.abs(position.x - gesture.start.x);
    const height = Math.abs(position.y - gesture.start.y);
    setDraft((current) => ({
      ...current,
      x: left,
      y: top,
      width,
      height,
      endX: position.x,
      endY: position.y,
    }));
  }

  function handleCanvasPointerUp() {
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (gesture.type === "pan") {
      gestureRef.current = null;
      return;
    }
    if (gesture.type !== "draw") return;
    gestureRef.current = null;
    setDraft(null);
    const end = gesture.current;
    if (gesture.tool === "eraser") return;
    if (gesture.tool === "pen" || gesture.tool === "highlighter") {
      const points = gesture.points;
      const path = points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");
      commit([
        ...objectsRef.current,
        {
          id: createId(),
          type: "stroke",
          path,
          x: 0,
          y: 0,
          color,
          width: gesture.tool === "highlighter" ? strokeWidth * 3 : strokeWidth,
          opacity: (gesture.tool === "highlighter" ? 0.3 : 1) * opacity / 100,
        },
      ]);
      return;
    }
    if (Math.hypot(end.x - gesture.start.x, end.y - gesture.start.y) < 4) return;
    const left = Math.min(gesture.start.x, end.x);
    const top = Math.min(gesture.start.y, end.y);
    const width = Math.abs(end.x - gesture.start.x);
    const height = Math.abs(end.y - gesture.start.y);
    const shape = {
      id: createId(),
      type: gesture.tool,
      x: gesture.tool === "arrow" ? gesture.start.x : left,
      y: gesture.tool === "arrow" ? gesture.start.y : top,
      width,
      height,
      endX: end.x,
      endY: end.y,
      color,
      strokeWidth,
    };
    commit([...objectsRef.current, shape]);
    setSelectedId(shape.id);
  }

  function handleObjectPointerDown(event, object) {
    event.stopPropagation();
    if (tool === "eraser") {
      commit(objectsRef.current.filter((candidate) => candidate.id !== object.id));
      setSelectedId(null);
      return;
    }
    if (tool !== "select") return;
    setSelectedId(object.id);
    const position = pointerPosition(event, pan, zoom, canvasRef.current);
    gestureRef.current = {
      type: "move",
      id: object.id,
      start: position,
      original: object,
      previous: objectsRef.current,
      moved: false,
    };
    event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
  }

  function handleObjectPointerMove(event) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.type !== "move") return;
    const position = pointerPosition(event, pan, zoom);
    const dx = position.x - gesture.start.x;
    const dy = position.y - gesture.start.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) gesture.moved = true;
    setObjects((current) =>
      current.map((object) =>
        object.id === gesture.id
          ? {
              ...object,
              x: gesture.original.x + dx,
              y: gesture.original.y + dy,
              ...(object.type === "arrow"
                ? {
                    endX: gesture.original.endX + dx,
                    endY: gesture.original.endY + dy,
                  }
                : {}),
            }
          : object,
      ),
    );
  }

  function handleObjectPointerUp() {
    const gesture = gestureRef.current;
    if (gesture?.type === "move" && gesture.moved) pushHistory(gesture.previous);
    if (gesture?.type === "move") gestureRef.current = null;
  }

  function updateObjectText(id, text) {
    setObjects((current) => {
      const next = current.map((object) =>
        object.id === id ? { ...object, text } : object,
      );
      objectsRef.current = next;
      return next;
    });
  }

  function handleExport() {
    const svg = makeExportSvg(objects, title);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.trim() || "whiteboard"}.svg`.replace(/[<>:"/\\|?*]/g, "-");
    link.click();
    URL.revokeObjectURL(url);
  }

  function setZoomAroundCenter(nextZoom) {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    if (clamped === zoom) return;
    const center = { x: 800, y: 500 };
    setPan({
      x: center.x - ((center.x - pan.x) / zoom) * clamped,
      y: center.y - ((center.y - pan.y) / zoom) * clamped,
    });
    setZoom(clamped);
  }

  function fitToContent() {
    if (objects.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const padding = 120;
    const bounds = objects.reduce(
      (result, object) => {
        const width =
          object.type === "sticky"
            ? 220
            : object.type === "text"
              ? Math.max(120, (object.text?.length ?? 0) * (object.fontSize ?? 24) * 0.58)
              : Math.abs(object.width ?? 0);
        const height =
          object.type === "sticky"
            ? 180
            : object.type === "text"
              ? (object.text?.split("\n").length ?? 1) * (object.fontSize ?? 24) * 1.25
              : Math.abs(object.height ?? 0);
        const startX = object.type === "stroke" ? object.x ?? 0 : object.x;
        const startY = object.type === "stroke" ? object.y ?? 0 : object.y;
        const endX =
          object.type === "arrow"
            ? object.endX
            : object.type === "stroke"
              ? startX + 0
              : startX + width;
        const endY =
          object.type === "arrow"
            ? object.endY
            : object.type === "stroke"
              ? startY + 0
              : startY + height;
        const strokeCoordinates =
          object.type === "stroke"
            ? object.path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
            : [];
        const strokePoints = [];
        for (let index = 0; index + 1 < strokeCoordinates.length; index += 2) {
          strokePoints.push({
            x: strokeCoordinates[index] + startX,
            y: strokeCoordinates[index + 1] + startY,
          });
        }
        const strokePadding = (object.width ?? 0) / 2;
        const pointBounds = strokePoints.length
          ? {
              minX: Math.min(...strokePoints.map((point) => point.x)) - strokePadding,
              minY: Math.min(...strokePoints.map((point) => point.y)) - strokePadding,
              maxX: Math.max(...strokePoints.map((point) => point.x)) + strokePadding,
              maxY: Math.max(...strokePoints.map((point) => point.y)) + strokePadding,
            }
          : null;
        return {
          minX: Math.min(result.minX, pointBounds?.minX ?? startX, startX, endX),
          minY: Math.min(result.minY, pointBounds?.minY ?? startY, startY, endY),
          maxX: Math.max(result.maxX, pointBounds?.maxX ?? startX, startX, endX),
          maxY: Math.max(result.maxY, pointBounds?.maxY ?? startY, startY, endY),
        };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if (!canvasBounds || canvasBounds.width === 0 || canvasBounds.height === 0) return;

    const scaleX = (1600 - padding * 2) / Math.max(1, bounds.maxX - bounds.minX);
    const scaleY = (1000 - padding * 2) / Math.max(1, bounds.maxY - bounds.minY);
    const fittedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)));
    setZoom(fittedZoom);
    setPan({
      x: 800 - ((bounds.minX + bounds.maxX) / 2) * fittedZoom,
      y: 500 - ((bounds.minY + bounds.maxY) / 2) * fittedZoom,
    });
  }

  function clearBoard() {
    if (objectsRef.current.length === 0) return;
    if (!window.confirm("Clear everything on this board? This can be undone.")) return;
    commit([]);
    setSelectedId(null);
  }

  const canvasCursor = tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair";

  return (
    <div className="whiteboard-app" data-theme={theme}>
      <header className="whiteboard-header">
        <button type="button" className="whiteboard-brand" onClick={onClose} aria-label="Back to workspace">
          <span className="whiteboard-brand-mark"><FontAwesomeIcon icon={faChalkboard} /></span>
          <span><strong>VSR</strong><small>workspace</small></span>
        </button>
        <span className="whiteboard-header-divider" />
        <div className="whiteboard-title-wrap">
          <input
            aria-label="Board name"
            className="whiteboard-title-input"
            value={title}
            maxLength={70}
            onChange={(event) => setTitle(event.target.value)}
          />
          <span className="whiteboard-save-state">
            <FontAwesomeIcon icon={faCheck} /> {storageMessage ? "Not saved" : "Saved locally"}
          </span>
        </div>
        <div className="whiteboard-header-actions">
          <button type="button" className="whiteboard-export-button" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /><span>Export SVG</span>
          </button>
          <button type="button" className="whiteboard-exit-button" onClick={onClose} aria-label="Back to documents" title="Back to documents">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </header>

      <div className="whiteboard-workspace">
        <aside className="whiteboard-tools" aria-label="Drawing tools">
          {TOOLS.map((item, index) => (
            <span className={`whiteboard-tool-group${index === 5 ? " tool-group-separated" : ""}`} key={item.id}>
              <button
                type="button"
                className={`whiteboard-tool-button${tool === item.id ? " is-active" : ""}`}
                title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}`}
                aria-label={item.label}
                aria-pressed={tool === item.id}
                onClick={() => setTool(item.id)}
              >
                <FontAwesomeIcon icon={item.icon} />
              </button>
              <span className="whiteboard-tooltip">{item.label}{item.shortcut && <kbd>{item.shortcut}</kbd>}</span>
            </span>
          ))}
          <span className="whiteboard-tool-group tool-group-separated">
            <button type="button" className="whiteboard-tool-button clear-tool" onClick={clearBoard} aria-label="Clear board" title="Clear board">
              <FontAwesomeIcon icon={faTrash} />
            </button>
            <span className="whiteboard-tooltip">Clear board</span>
          </span>
        </aside>

        <aside className="whiteboard-properties" aria-label="Board settings">
          <div className="properties-heading"><span>QUICK STYLE</span><FontAwesomeIcon icon={faLayerGroup} /></div>
          <label className="style-control-label" htmlFor="whiteboard-stroke">Stroke</label>
          <div className="stroke-slider-row">
            <input id="whiteboard-stroke" type="range" min="1" max="12" value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))} />
            <span>{strokeWidth}</span>
          </div>
          <div className="style-divider" />
          <span className="style-control-label">Color</span>
          <div className="whiteboard-color-list" aria-label="Stroke color">
            {COLORS.map((swatch) => (
              <button
                type="button"
                key={swatch}
                className={`whiteboard-color-swatch${color === swatch ? " is-selected" : ""}`}
                style={{ "--swatch": swatch }}
                aria-label={`Set color ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => setColor(swatch)}
              />
            ))}
          </div>
          <div className="style-divider" />
          <span className="style-control-label">Canvas</span>
          <div className="whiteboard-background-options">
            {[
              { id: "dots", name: "Dots" },
              { id: "grid", name: "Grid" },
              { id: "plain", name: "Plain" },
            ].map((option) => (
              <button
                type="button"
                key={option.id}
                className={`background-option${background === option.id ? " is-selected" : ""}`}
                onClick={() => setBackground(option.id)}
                aria-pressed={background === option.id}
              >
                <span className={`background-preview background-preview-${option.id}`} />
                {option.name}
              </button>
            ))}
          </div>
          {storageMessage && <p className="whiteboard-storage-error" role="alert">{storageMessage}</p>}
          <div className="whiteboard-tip">
            <span className="whiteboard-tip-icon">✦</span>
            <strong>Make space for ideas</strong>
            <p>Drag on the canvas to draw. Double-click text to edit it. Everything saves in this browser.</p>
          </div>
        </aside>

        <div className="whiteboard-canvas-region">
          <div className="whiteboard-top-tools">
            <button type="button" aria-label="Undo" title="Undo (Ctrl+Z)" onClick={undo} disabled={!historyAvailability.canUndo}>
              <FontAwesomeIcon icon={faRotateLeft} />
            </button>
            <button type="button" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!historyAvailability.canRedo}>
              <FontAwesomeIcon icon={faRotateRight} />
            </button>
            <span className="canvas-toolbar-divider" />
            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out"
              onClick={() => setZoomAroundCenter(zoom - ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <button
              type="button"
              className="zoom-percentage"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              title="Reset zoom and center canvas"
              aria-label="Reset zoom to 100 percent"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              onClick={() => setZoomAroundCenter(zoom + ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button
              type="button"
              aria-label="Fit content to canvas"
              title="Fit content to canvas"
              onClick={fitToContent}
            >
              <FontAwesomeIcon icon={faExpand} />
            </button>
          </div>
          <svg
            ref={canvasRef}
            className={`whiteboard-canvas whiteboard-canvas-${background}`}
            aria-label="Interactive whiteboard canvas"
            role="application"
            viewBox="0 0 1600 1000"
            preserveAspectRatio="none"
            style={{ cursor: canvasCursor }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={(event) => {
              handleCanvasPointerMove(event);
              handleObjectPointerMove(event);
            }}
            onPointerUp={() => {
              handleCanvasPointerUp();
              handleObjectPointerUp();
            }}
            onPointerCancel={() => {
              gestureRef.current = null;
              setDraft(null);
            }}
          >
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              {objects.map((object) => (
                <WhiteboardObject
                  key={object.id}
                  object={object}
                  isSelected={selectedId === object.id}
                  onPointerDown={handleObjectPointerDown}
                  onErase={(id) => {
                    commit(objectsRef.current.filter((candidate) => candidate.id !== id));
                    setSelectedId(null);
                  }}
                  onTextChange={updateObjectText}
                />
              ))}
              {draft && (
                <WhiteboardObject
                  object={{ ...draft, id: "draft" }}
                  isSelected={false}
                  onPointerDown={() => {}}
                  onErase={() => {}}
                  onTextChange={() => {}}
                />
              )}
            </g>
            {objects.length === 0 && !draft && (
              <g className="whiteboard-empty-hint" transform="translate(800 500)">
                <text x="0" y="-8" textAnchor="middle">A little space for your big ideas.</text>
                <text x="0" y="22" textAnchor="middle">Choose a tool and start creating.</text>
              </g>
            )}
          </svg>
          <div className="whiteboard-canvas-caption">
            <span><span className="whiteboard-live-dot" /> Board is private to this device</span>
            <span>{objects.length} {objects.length === 1 ? "object" : "objects"}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Whiteboard;
