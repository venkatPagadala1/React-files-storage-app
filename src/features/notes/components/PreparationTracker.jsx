import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faChalkboard,
  faCircleDot,
  faEraser,
  faList,
  faPen,
  faPlus,
  faRotateLeft,
  faThumbtack,
  faXmark,
  faGripVertical,
} from "@fortawesome/free-solid-svg-icons";
import { createId } from "../../../lib/workspaceUtils.js";

function PreparationTracker({
  boardTitle,
  isTrainingPreparation,
  draftTopics,
  boardStrokes,
  draggedTopicId,
  topicDropTarget,
  onAddTopic,
  onUpdateTopic,
  onBoardStrokesChange,
  onRemoveTopic,
  onTogglePinned,
  onMoveTopic,
  onTopicDragStart,
  onTopicDragOver,
  onTopicDrop,
  onTopicDragEnd,
  onTopicDragLeave,
}) {
  const [view, setView] = useState("board");
  const [inkTool, setInkTool] = useState("pen");
  const [inkColor, setInkColor] = useState("#fff1a1");
  const [inkWidth, setInkWidth] = useState(3);
  const [draftStroke, setDraftStroke] = useState(null);
  const draftStrokeRef = useRef(null);
  const boardCanvasRef = useRef(null);
  const namedTopics = draftTopics.filter((topic) => topic.title.trim());
  const completedCount = namedTopics.filter(
    (topic) => topic.status === "done",
  ).length;
  const inProgressCount = namedTopics.filter(
    (topic) => topic.status === "in-progress",
  ).length;
  const progress = namedTopics.length
    ? Math.round((completedCount / namedTopics.length) * 100)
    : 0;
  const inkColors = [
    { value: "#fff1a1", label: "Yellow ink" },
    { value: "#f8fafc", label: "White ink" },
    { value: "#ff914d", label: "Orange ink" },
    { value: "#7fc8ff", label: "Blue ink" },
    { value: "#9ce5b5", label: "Green ink" },
  ];

  function getBoardPoint(event) {
    const bounds = boardCanvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * 1600 / bounds.width,
      y: (event.clientY - bounds.top) * 1000 / bounds.height,
    };
  }

  function removeStrokeAt(point) {
    const tolerance = 20;
    onBoardStrokesChange((strokes) =>
      strokes.filter(
        (stroke) =>
          !stroke.points?.some(
            (candidatePoint) =>
              Math.hypot(candidatePoint.x - point.x, candidatePoint.y - point.y) <
              tolerance + (stroke.width ?? 0),
          ),
      ),
    );
  }

  function handleBoardPointerDown(event) {
    if (event.button !== 0 || inkTool === "select") return;
    if (event.target.closest("input, textarea, select, button, summary")) return;
    const point = getBoardPoint(event);
    if (inkTool === "eraser") {
      removeStrokeAt(point);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const stroke = {
      id: createId(),
      color: inkColor,
      width: inkWidth,
      points: [point],
      path: `M ${point.x} ${point.y}`,
    };
    draftStrokeRef.current = stroke;
    setDraftStroke(stroke);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleBoardPointerMove(event) {
    if (inkTool === "eraser" && event.buttons === 1) {
      removeStrokeAt(getBoardPoint(event));
      return;
    }
    const currentStroke = draftStrokeRef.current;
    if (!currentStroke) return;
    const point = getBoardPoint(event);
    const nextStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point],
      path: `${currentStroke.path} L ${point.x} ${point.y}`,
    };
    draftStrokeRef.current = nextStroke;
    setDraftStroke(nextStroke);
  }

  function finishBoardStroke() {
    const finishedStroke = draftStrokeRef.current;
    if (finishedStroke) {
      onBoardStrokesChange((strokes) => [...strokes, finishedStroke]);
    }
    draftStrokeRef.current = null;
    setDraftStroke(null);
  }

  return (
    <section
      className={`note-topics-panel mb-[14px] rounded-xl border border-[color-mix(in_srgb,var(--workspace-accent)_15%,#e1e4ec)] p-[11px]${view === "board" ? " is-board-view min-h-0 flex flex-1 flex-col m-0 overflow-hidden rounded-none border-0 bg-transparent p-0" : ""}`}
      aria-label="Preparation topics"
    >
      <div className={`note-topics-heading flex items-center justify-between gap-[10px] ${view === "board" ? "mb-[10px] flex-none" : ""}`}>
        <div className="grid min-w-0 gap-[3px]">
          <span className={`editor-label m-0 text-[0.7rem] font-semibold text-[#545d6d] ${view === "board" ? "text-[0.83rem] font-bold tracking-[-0.02em] text-[#333e51]" : ""}`}>
            {isTrainingPreparation ? "Training preparation" : "Interview preparation"}
          </span>
          <span className={`note-topics-hint text-[0.63rem] leading-[1.45] text-[var(--workspace-muted)] ${view === "board" ? "text-[0.68rem] text-[#8b95a5]" : ""}`}>
            {isTrainingPreparation
              ? "Capture learning goals, key notes, and topics to revisit."
              : "Sketch out ideas or organize your study plan."}
          </span>
        </div>
        <div className={`preparation-board-actions flex items-center gap-[9px] ${view === "board" ? "flex-none max-[600px]:gap-[5px]" : ""}`}>
          <div className="preparation-view-switch inline-flex rounded-[9px] border border-[#e6e9ef] bg-[#f5f6f9] p-[3px]" role="group" aria-label="Preparation view">
            <button
              type="button"
              className={`inline-flex min-h-[27px] items-center justify-center gap-[6px] rounded-md border-0 px-2 font-[inherit] text-[0.62rem] font-semibold max-[600px]:gap-1 max-[600px]:px-[6px] ${view === "board" ? "is-active bg-white text-[var(--workspace-accent)] shadow-[0_1px_3px_rgb(34_44_66_/_12%)]" : "bg-transparent text-[#788295]"}`}
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
              title="Handwriting board"
            >
              <FontAwesomeIcon icon={faChalkboard} />
              <span>Board</span>
            </button>
            <button
              type="button"
              className={`inline-flex min-h-[27px] items-center justify-center gap-[6px] rounded-md border-0 px-2 font-[inherit] text-[0.62rem] font-semibold max-[600px]:gap-1 max-[600px]:px-[6px] ${view === "tracker" ? "is-active bg-white text-[var(--workspace-accent)] shadow-[0_1px_3px_rgb(34_44_66_/_12%)]" : "bg-transparent text-[#788295]"}`}
              onClick={() => setView("tracker")}
              aria-pressed={view === "tracker"}
              title="Study plan table"
            >
              <FontAwesomeIcon icon={faList} />
              <span>Tracker</span>
            </button>
          </div>
          <button
            type="button"
            className="note-topic-add inline-flex min-h-[30px] items-center gap-[6px] whitespace-nowrap rounded-lg border border-[color-mix(in_srgb,var(--workspace-accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--workspace-accent)_9%,white)] px-[9px] font-[inherit] text-[0.66rem] font-semibold text-[var(--workspace-accent)]"
            onClick={onAddTopic}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add topic
          </button>
        </div>
      </div>
      {view === "board" ? (
        <div className="preparation-board mt-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[#242a35] bg-[#111318] shadow-[0_10px_28px_rgb(17_21_29_/_14%)]">
          <div className="preparation-board-toolbar flex min-h-12 flex-none items-center justify-between gap-3 border-b border-[#262b35] bg-[#111318] px-[14px] text-[#adb3c0] max-[700px]:min-h-11 max-[700px]:gap-[7px] max-[700px]:px-[9px] max-[600px]:flex-wrap max-[600px]:py-[7px]">
            <div className="preparation-board-tools flex flex-none items-center gap-[7px] max-[700px]:gap-[3px]" aria-label="Drawing tools">
              <button
                type="button"
                className={`preparation-board-tool grid h-[29px] w-[29px] place-items-center rounded-[7px] border border-transparent text-[0.74rem] transition-colors max-[700px]:h-[27px] max-[700px]:w-[26px] ${inkTool === "pen" ? "border-[#343a47] bg-[#252a35] text-[#f1f3f6] shadow-[inset_0_1px_0_rgb(255_255_255_/_5%)]" : "text-[#9299a7] hover:bg-[#222630] hover:text-[#f1f3f6]"}`}
                onClick={() => setInkTool("pen")}
                aria-label="Pen tool"
                aria-pressed={inkTool === "pen"}
                title="Draw with pen"
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                type="button"
                className={`preparation-board-tool grid h-[29px] w-[29px] place-items-center rounded-[7px] border border-transparent text-[0.74rem] transition-colors max-[700px]:h-[27px] max-[700px]:w-[26px] ${inkTool === "eraser" ? "border-[#343a47] bg-[#252a35] text-[#f1f3f6] shadow-[inset_0_1px_0_rgb(255_255_255_/_5%)]" : "text-[#9299a7] hover:bg-[#222630] hover:text-[#f1f3f6]"}`}
                onClick={() => setInkTool("eraser")}
                aria-label="Eraser tool"
                aria-pressed={inkTool === "eraser"}
                title="Erase ink"
              >
                <FontAwesomeIcon icon={faEraser} />
              </button>
              <button
                type="button"
                className={`preparation-board-tool grid h-[29px] w-[29px] place-items-center rounded-[7px] border border-transparent text-[0.74rem] transition-colors max-[700px]:h-[27px] max-[700px]:w-[26px] ${inkTool === "select" ? "border-[#343a47] bg-[#252a35] text-[#f1f3f6] shadow-[inset_0_1px_0_rgb(255_255_255_/_5%)]" : "text-[#9299a7] hover:bg-[#222630] hover:text-[#f1f3f6]"}`}
                onClick={() => setInkTool("select")}
                aria-label="Select and edit text"
                aria-pressed={inkTool === "select"}
                title="Select and edit text"
              >
                <FontAwesomeIcon icon={faCircleDot} />
              </button>
              <span className="preparation-board-tool-divider mx-[3px] h-[19px] w-px bg-[#30343e]" />
              {inkColors.map((ink) => (
                <button
                  type="button"
                  key={ink.value}
                  className={`preparation-ink-swatch mx-0.5 h-[14px] w-[14px] rounded-full border-0 bg-[var(--preparation-ink)] shadow-[0_0_0_1px_rgb(255_255_255_/_13%)] max-[700px]:mx-px max-[700px]:h-[11px] max-[700px]:w-[11px] ${inkColor === ink.value ? "is-selected shadow-[0_0_0_2px_#111318,0_0_0_3px_var(--preparation-ink)]" : ""}`}
                  style={{ "--preparation-ink": ink.value }}
                  onClick={() => setInkColor(ink.value)}
                  aria-label={ink.label}
                  aria-pressed={inkColor === ink.value}
                  title={ink.label}
                />
              ))}
              <label className="preparation-ink-width ml-[5px] inline-flex items-center gap-[5px] text-[0.59rem] text-[#818a99] max-[700px]:ml-px max-[700px]:gap-[3px]" title="Pen width">
                <span>Width</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={inkWidth}
                  onChange={(event) => setInkWidth(Number(event.target.value))}
                  aria-label="Pen width"
                  className="h-[3px] w-[54px] cursor-pointer accent-[#91a1bb] max-[700px]:w-[37px]"
                />
              </label>
            </div>
            <div className="preparation-board-page mx-0 flex min-w-0 flex-1 items-center justify-center gap-[7px] overflow-hidden whitespace-nowrap text-ellipsis text-[0.68rem] text-[#c1c7d1] max-[700px]:order-0 max-[700px]:w-auto max-[700px]:text-[0.61rem]">
              <span className="max-w-[240px] overflow-hidden text-ellipsis font-semibold text-[#e1e4eb] max-[700px]:max-w-[110px]">{boardTitle?.trim() || "Untitled preparation"}</span>
              <span className="preparation-board-page-divider text-[#697180]">·</span>
              <span>1 / 1</span>
              {namedTopics.length > 0 && (
                <>
                  <span className="preparation-board-page-divider text-[#697180]">·</span>
                  <span>{progress}% prepared</span>
                </>
              )}
            </div>
            <span className="preparation-board-mode inline-flex items-center gap-[13px] whitespace-nowrap text-[0.6rem] text-[#8d96a6] max-[700px]:gap-1">
              <span className="preparation-board-page-count text-[0.63rem] text-[#8992a1] max-[700px]:hidden">{draftTopics.length + 1} pages</span>
              <button
                type="button"
                className="preparation-board-undo grid h-[26px] w-[26px] place-items-center rounded-[7px] border border-transparent bg-transparent text-[0.67rem] text-[#a4acb9] hover:border-[#393e49] hover:bg-[#252a34] hover:text-white disabled:cursor-default disabled:text-[#525966]"
                onClick={() => onBoardStrokesChange((strokes) => strokes.slice(0, -1))}
                disabled={boardStrokes.length === 0}
                title="Undo last pen stroke"
                aria-label="Undo last pen stroke"
              >
                <FontAwesomeIcon icon={faRotateLeft} />
              </button>
              <span className="inline-flex items-center gap-[6px] max-[700px]:hidden"><FontAwesomeIcon icon={faCircleDot} className="text-[0.57rem] text-[#56bd8b]" /> Study board</span>
            </span>
          </div>

          <div
            className={`preparation-board-canvas relative min-h-0 max-h-none flex-1 overflow-auto bg-[#111318] text-[#f5f5f3] [scrollbar-color:#414652_#17191f] [scrollbar-width:thin] ink-tool-${inkTool}`}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={finishBoardStroke}
            onPointerCancel={finishBoardStroke}
          >
            <div className="preparation-board-content relative box-border min-h-full px-[clamp(28px,6vw,84px)] pt-[clamp(34px,5vh,58px)] pb-[55px] max-[700px]:min-h-[540px] max-[700px]:px-[22px] max-[700px]:pt-[34px] max-[700px]:pb-11" ref={boardCanvasRef}>
              <svg
                className="preparation-board-ink"
                viewBox="0 0 1600 1000"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {[...boardStrokes, ...(draftStroke ? [draftStroke] : [])].map((stroke) => (
                  <path
                    key={stroke.id}
                    d={stroke.path}
                    fill="none"
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              <div className="preparation-board-title mb-[clamp(23px,4vh,40px)] w-fit max-w-full">
                <input
                  className="w-[min(460px,100%)] border-0 bg-transparent p-0 text-[clamp(1.7rem,3vw,2.3rem)] leading-[1.3] tracking-[0.025em] text-[#ffe15a] outline-none placeholder:text-[#ffe15a] placeholder:opacity-[0.85] [font:500_clamp(1.7rem,3vw,2.3rem)/1.3_'Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive]"
                  value={boardTitle?.trim() || ""}
                  readOnly
                  aria-label="Preparation board title"
                  placeholder="Your preparation plan"
                />
                <span className="mt-[7px] block h-0.5 w-full bg-[linear-gradient(90deg,#d6c23f,rgb(214_194_63_/_15%))]" />
              </div>
              {draftTopics.length === 0 ? (
                <div className="preparation-board-empty mt-0 ml-9 grid max-w-[340px] justify-items-start gap-[10px] py-[14px] text-[#a8afbb]">
                <span className="preparation-board-empty-mark text-2xl text-[#f5de68]">✳</span>
                <strong className="text-[1.13rem] text-[#e6e8ed] [font:500_1.13rem/1.5_'Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive]">A blank page, a fresh start.</strong>
                <span className="text-[0.72rem] leading-[1.6] text-[#9299a6]">Add a topic to begin sketching out your preparation.</span>
                <button className="mt-[3px] inline-flex min-h-[31px] items-center gap-[6px] rounded-[7px] border border-[#4d5670] bg-[#232936] px-[10px] font-[inherit] text-[0.68rem] text-[#d3ddf2] hover:border-[#7588af] hover:bg-[#293247]" type="button" onClick={onAddTopic}>
                    <FontAwesomeIcon icon={faPlus} /> Add your first topic
                  </button>
                </div>
              ) : (
                <div className="preparation-board-topics grid w-[min(100%,880px)] gap-[clamp(14px,2.4vh,24px)]">
                  {draftTopics.map((topic, index) => (
                    <article
                      className={`preparation-board-topic group min-w-0 border-b border-dashed border-[rgb(159_168_183_/_11%)] pb-[10px] last:border-b-0${draggedTopicId === topic.id ? " is-dragging" : ""}`}
                      key={topic.id}
                      onDragOver={(event) => onTopicDragOver(event, topic)}
                      onDrop={(event) => onTopicDrop(event, topic)}
                      onDragLeave={onTopicDragLeave}
                    >
                      <div className="preparation-board-topic-heading flex items-center gap-[11px] max-[600px]:flex-wrap max-[600px]:gap-[5px]">
                        <button
                          type="button"
                          className="preparation-board-topic-number min-w-[25px] flex-none cursor-grab border-0 bg-transparent p-0 text-[clamp(1rem,1.6vw,1.2rem)] leading-[1.7] text-[#e4e8ed] [font-family:'Segoe_Print','Bradley_Hand',cursive]"
                          draggable
                          onDragStart={(event) => onTopicDragStart(event, topic.id)}
                          onDragEnd={onTopicDragEnd}
                          aria-label={`Drag ${topic.title || `topic ${index + 1}`} to change priority`}
                          title="Drag to reorder"
                        >
                          {index + 1})
                        </button>
                        <input
                          className="preparation-board-topic-title min-w-[60px] w-full border-0 border-b border-transparent bg-transparent px-0 py-px text-[clamp(1rem,1.6vw,1.2rem)] leading-[1.7] text-[var(--preparation-ink)] outline-none focus:border-b-[color-mix(in_srgb,var(--preparation-ink)_45%,transparent)] placeholder:text-[#b1b8c2] placeholder:opacity-[0.66] [font-family:'Segoe_Print','Bradley_Hand',cursive] max-[600px]:flex-1 max-[600px]:text-[0.94rem]"
                          style={{ "--preparation-ink": inkColor }}
                          value={topic.title}
                          onChange={(event) =>
                            onUpdateTopic(topic.id, { title: event.target.value })
                          }
                          placeholder="Write a topic…"
                          aria-label={`Preparation topic ${index + 1}`}
                          maxLength={120}
                        />
                        <button
                          type="button"
                          className={`preparation-board-pin grid h-[25px] w-[25px] flex-[0_0_25px] place-items-center rounded-md border-0 bg-transparent text-[0.68rem] text-[#798291] opacity-0 transition-[background,color,opacity] duration-[130ms] group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-[#282832] hover:text-[#f4d45c] ${topic.pinned ? "is-pinned text-[#f4d45c] opacity-100" : ""}`}
                          onClick={() => onTogglePinned(topic.id, !topic.pinned)}
                          aria-label={`${topic.pinned ? "Unpin" : "Pin"} ${topic.title || `topic ${index + 1}`}`}
                          aria-pressed={Boolean(topic.pinned)}
                          title={topic.pinned ? "Unpin topic" : "Pin topic"}
                        >
                          <FontAwesomeIcon icon={faThumbtack} />
                        </button>
                        <select
                          className={`preparation-board-status min-h-[23px] flex-none cursor-pointer rounded-md border border-[#393d47] bg-[#20232a] px-[6px] font-[inherit] text-[0.6rem] font-medium leading-none text-[#aeb6c4] outline-none max-[600px]:ml-[30px] max-[600px]:min-h-[22px] max-[600px]:text-[0.58rem] status-${topic.status}`}
                          value={topic.status}
                          onChange={(event) =>
                            onUpdateTopic(topic.id, { status: event.target.value })
                          }
                          aria-label={`Status for topic ${index + 1}`}
                          title="Preparation status"
                        >
                          <option value="not-started">To do</option>
                          <option value="in-progress">In progress</option>
                          <option value="done">Ready</option>
                        </select>
                        <button
                          type="button"
                          className="preparation-board-remove grid h-[25px] w-[25px] flex-[0_0_25px] place-items-center rounded-md border-0 bg-transparent text-[0.68rem] text-[#798291] opacity-0 transition-[background,color,opacity] duration-[130ms] group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-[#372526] hover:text-[#ff8585] max-[600px]:opacity-100"
                          onClick={() => onRemoveTopic(topic.id)}
                          aria-label={`Remove preparation topic ${index + 1}`}
                          title="Remove topic"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                      <textarea
                        className="preparation-board-note ml-[35px] mt-[5px] block min-h-7 w-[calc(100%-35px)] resize-y border-0 bg-transparent px-0 py-[2px] text-[clamp(0.82rem,1.2vw,0.97rem)] leading-[1.75] text-[#e9ebef] outline-none placeholder:text-[0.76rem] placeholder:leading-[1.8] placeholder:text-[#777e8a] focus:bg-white/[0.02] [font-family:'Segoe_Print','Bradley_Hand',cursive] max-[600px]:ml-[31px] max-[600px]:w-[calc(100%-31px)]"
                        value={topic.importantNotes}
                        onChange={(event) =>
                          onUpdateTopic(topic.id, {
                            importantNotes: event.target.value,
                          })
                        }
                        placeholder="Add your key ideas, examples, and explanations…"
                        maxLength={1500}
                        aria-label={`Important notes for topic ${index + 1}`}
                        rows={2}
                      />
                      <div className="preparation-board-issue ml-[37px] mt-px flex items-start gap-[9px] max-[600px]:ml-8">
                        <span className="pt-1 text-[0.9rem] leading-[1.8] text-[#ff914d] [font-family:'Segoe_Print','Bradley_Hand',cursive]">↳</span>
                        <textarea
                          className="block min-h-[27px] w-full resize-y border-0 bg-transparent px-0 py-[2px] text-[clamp(0.82rem,1.2vw,0.97rem)] leading-[1.75] text-[#ffac76] outline-none placeholder:text-[0.76rem] placeholder:leading-[1.8] placeholder:text-[#777e8a] focus:bg-white/[0.02] [font-family:'Segoe_Print','Bradley_Hand',cursive]"
                          value={topic.issues}
                          onChange={(event) =>
                            onUpdateTopic(topic.id, {
                              issues: event.target.value,
                            })
                          }
                          placeholder="Questions to revisit or gaps to fill…"
                          maxLength={1000}
                          aria-label={`Gaps or issues for topic ${index + 1}`}
                          rows={1}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <div className="preparation-board-footer flex min-h-9 flex-none items-center justify-between border-t border-[#252a34] bg-[#101115] px-4 text-[0.61rem] text-[#858d9a]">
              <span className="flex items-center gap-[7px]"><span className="preparation-board-live-dot h-[6px] w-[6px] rounded-full bg-[#49c18a] shadow-[0_0_0_3px_rgb(73_193_138_/_12%)]" /> Autosaved with your note</span>
              <span>{namedTopics.length} {namedTopics.length === 1 ? "topic" : "topics"}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
      {namedTopics.length > 0 && (
        <div className="preparation-progress" aria-live="polite">
          <div className="preparation-progress-summary">
            <span>
              <strong>{completedCount}</strong> of {namedTopics.length} topics complete
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className="preparation-progress-track"
            role="progressbar"
            aria-label={`${isTrainingPreparation ? "Training" : "Interview preparation"} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="preparation-progress-counts">
            <span>{inProgressCount} in progress</span>
            <span>
              {namedTopics.length - completedCount - inProgressCount} not started
            </span>
          </div>
        </div>
      )}
      {draftTopics.length > 0 ? (
        <div className="note-topic-table-wrap">
          <table className="note-topic-table">
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col">Important notes</th>
                <th scope="col">Issues to revisit</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {draftTopics.map((topic, index) => (
                <tr
                  key={topic.id}
                  className={[
                    draggedTopicId === topic.id ? "is-dragging" : "",
                    topicDropTarget?.id === topic.id
                      ? `topic-drop-${topicDropTarget.position}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragOver={(event) => onTopicDragOver(event, topic)}
                  onDrop={(event) => onTopicDrop(event, topic)}
                  onDragLeave={(event) => onTopicDragLeave(event)}
                >
                  <td data-label="Topic">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(event) =>
                        onUpdateTopic(topic.id, { title: event.target.value })
                      }
                      placeholder={`Topic ${index + 1}`}
                      aria-label={`Preparation topic ${index + 1}`}
                      maxLength={120}
                    />
                  </td>
                  <td data-label="Important notes">
                    <textarea
                      value={topic.importantNotes}
                      onChange={(event) =>
                        onUpdateTopic(topic.id, {
                          importantNotes: event.target.value,
                        })
                      }
                      placeholder="Key ideas, examples, and explanations"
                      maxLength={1500}
                      aria-label={`Important notes for topic ${index + 1}`}
                      rows={2}
                    />
                  </td>
                  <td data-label="Issues to revisit">
                    <textarea
                      value={topic.issues}
                      onChange={(event) =>
                        onUpdateTopic(topic.id, { issues: event.target.value })
                      }
                      placeholder="Questions, gaps, or practice to revisit"
                      maxLength={1000}
                      aria-label={`Gaps or issues for topic ${index + 1}`}
                      rows={2}
                    />
                  </td>
                  <td data-label="Status">
                    <select
                      value={topic.status}
                      onChange={(event) =>
                        onUpdateTopic(topic.id, { status: event.target.value })
                      }
                      aria-label={`Status for topic ${index + 1}`}
                      className={`topic-status-select status-${topic.status}`}
                    >
                      <option value="not-started">Not started</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  <td data-label="Priority">
                    <div className="topic-priority-controls">
                      <button
                        type="button"
                        className="topic-drag-handle"
                        draggable
                        onDragStart={(event) => onTopicDragStart(event, topic.id)}
                        onDragEnd={onTopicDragEnd}
                        aria-label={`Drag ${topic.title || `topic ${index + 1}`} to change priority`}
                        title="Drag to change priority"
                      >
                        <FontAwesomeIcon icon={faGripVertical} />
                      </button>
                      <button
                        type="button"
                        className={`topic-pin-button${topic.pinned ? " is-pinned" : ""}`}
                        onClick={() => onTogglePinned(topic.id, !topic.pinned)}
                        aria-label={`${topic.pinned ? "Unpin" : "Pin"} ${topic.title || `topic ${index + 1}`}`}
                        aria-pressed={Boolean(topic.pinned)}
                        title={topic.pinned ? "Unpin topic" : "Pin to top"}
                      >
                        <FontAwesomeIcon icon={faThumbtack} />
                      </button>
                      <button
                        type="button"
                        className="topic-priority-button"
                        onClick={() => onMoveTopic(topic.id, -1)}
                        disabled={
                          index === 0 ||
                          draftTopics[index - 1].pinned !== topic.pinned
                        }
                        aria-label={`Move ${topic.title || `topic ${index + 1}`} up in priority`}
                        title="Move up"
                      >
                        <FontAwesomeIcon icon={faArrowUp} />
                      </button>
                      <button
                        type="button"
                        className="topic-priority-button"
                        onClick={() => onMoveTopic(topic.id, 1)}
                        disabled={
                          index === draftTopics.length - 1 ||
                          draftTopics[index + 1].pinned !== topic.pinned
                        }
                        aria-label={`Move ${topic.title || `topic ${index + 1}`} down in priority`}
                        title="Move down"
                      >
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                    </div>
                  </td>
                  <td data-label="Actions">
                    <button
                      type="button"
                      className="note-topic-remove"
                      onClick={() => onRemoveTopic(topic.id)}
                      aria-label={`Remove preparation topic ${index + 1}`}
                      title="Remove topic"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="note-topics-empty">
          <strong>
            {isTrainingPreparation
              ? "Build your training plan"
              : "Build your interview study plan"}
          </strong>
          <span>
            {isTrainingPreparation
              ? "Add learning topics, note important ideas, and track what you want to revisit."
              : "Add topics such as fundamentals, system design, or practice questions. For each one, keep your key notes and list anything you need to revisit."}
          </span>
        </div>
      )}
        </>
      )}
    </section>
  );
}

export default PreparationTracker;
