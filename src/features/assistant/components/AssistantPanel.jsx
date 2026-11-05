import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faPaperPlane,
  faRobot,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

function AssistantPanel({
  isOpen,
  activeItem,
  assistantModelState,
  assistantModelProgress,
  assistantMessages,
  isAssistantLoading,
  assistantError,
  assistantInput,
  messagesEndRef,
  inputRef,
  onOpen,
  onClose,
  onRetry,
  onAsk,
  onInputChange,
  onSuggestion,
}) {
  if (!isOpen) {
    return (
      <button
        type="button"
        className="assistant-launcher fixed right-6 bottom-6 z-20 inline-flex min-h-12 items-center justify-center gap-[9px] rounded-full border border-[color-mix(in_srgb,var(--palette-primary)_75%,white)] bg-[linear-gradient(120deg,var(--palette-primary),color-mix(in_srgb,var(--palette-primary)_72%,#161a2c))] px-[18px] font-[inherit] text-[0.78rem] font-[720] text-white shadow-[0_10px_28px_color-mix(in_srgb,var(--palette-primary)_35%,transparent)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_color-mix(in_srgb,var(--palette-primary)_42%,transparent)]"
        onClick={onOpen}
        aria-label="Open AI assistant"
        title="Ask VSR AI"
      >
        <FontAwesomeIcon icon={faRobot} className="text-base" />
        <span>Ask AI</span>
      </button>
    );
  }

  return (
    <aside
      className="assistant-panel fixed right-[22px] bottom-[22px] z-20 flex h-[min(650px,calc(100vh-44px))] w-[min(410px,calc(100vw-32px))] flex-col overflow-hidden rounded-[20px] border border-[#e0e4ed] bg-white text-[#30384a] shadow-[0_24px_80px_rgb(19_26_44_/_25%)]"
      aria-label="AI assistance"
      aria-live="polite"
    >
      <header className="assistant-panel-header flex min-h-[68px] items-center gap-[11px] border-b border-[#edf0f5] bg-white px-[15px] py-[13px]">
        <div className="assistant-brand-icon grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[var(--palette-soft)] text-base text-[var(--palette-primary)]">
          <FontAwesomeIcon icon={faRobot} />
        </div>
        <div className="assistant-title-copy grid min-w-0 gap-1">
          <strong className="text-[0.82rem] text-[#30384a]">VSR AI assistant</strong>
          <span className="flex items-center gap-1.5 text-[0.66rem] text-[#858c9b]">
            <i className={`h-[7px] w-[7px] rounded-full ${assistantModelState === "ready" ? "assistant-status-online bg-[#22a996] shadow-[0_0_0_3px_rgb(34_169_150_/_12%)]" : "bg-[#e5a84b]"}`} />
            {assistantModelState === "ready"
              ? "AI ready · Runs on this device"
              : assistantModelState === "loading"
                ? assistantModelProgress || "Loading local AI"
                : assistantModelState === "unsupported"
                  ? "WebGPU not available"
                  : assistantModelState === "error"
                    ? "Could not load local AI"
                    : "Local model · Not downloaded"}
          </span>
        </div>
        <button
          type="button"
          className="icon-button assistant-close-button ml-auto"
          aria-label="Close AI assistant"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      <div className="assistant-context-note flex min-h-[38px] items-center gap-2 overflow-hidden border-b border-[#edf0f5] bg-[#fafbfe] px-[15px] py-[7px] text-[0.68rem] text-[#737c8f]">
        <FontAwesomeIcon icon={faFileLines} className="shrink-0 text-[var(--palette-primary)]" />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {activeItem
            ? `Context: ${activeItem.title}`
            : "Ask about the workspace or your open document"}
        </span>
      </div>

      <div className="assistant-messages flex min-h-0 flex-1 flex-col gap-[13px] overflow-auto bg-white px-[14px] py-[17px]" role="log" aria-label="Conversation">
        {assistantMessages.length === 0 ? (
          <div className="assistant-welcome m-auto max-w-[300px] text-center">
            <span className="assistant-welcome-mark mx-auto mb-3 grid h-[50px] w-[50px] place-items-center rounded-[17px] bg-[var(--palette-soft)] text-[1.2rem] text-[var(--palette-primary)]">
              <FontAwesomeIcon icon={faRobot} />
            </span>
            <h2 className="m-0 text-[0.95rem] text-[#30384a]">What can I help with?</h2>
            <p className="mt-[7px] mb-[15px] text-[0.72rem] leading-[1.5] text-[#858c9b]">Ask about the workspace or get help understanding the selected document.</p>
            <div className="assistant-suggestions grid gap-[7px]">
              {[
                "How do I organize my documents?",
                activeItem ? "Summarize the selected document" : "What can this workspace do?",
              ].map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  className="rounded-[10px] border border-[#e4e7ef] bg-white px-[11px] py-[9px] font-[inherit] text-left text-[0.69rem] text-[#586276] hover:border-[color-mix(in_srgb,var(--palette-primary)_38%,#e4e7ef)] hover:text-[var(--palette-primary)]"
                  onClick={() => onSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          assistantMessages.map((message, index) => (
            <div
              className={`assistant-message flex max-w-[90%] items-start gap-2 ${message.role === "assistant" ? "self-start" : "self-end"}`}
              key={`${message.role}-${index}`}
            >
              {message.role === "assistant" && (
                <FontAwesomeIcon icon={faRobot} className="mt-[10px] text-[0.8rem] text-[var(--palette-primary)]" aria-hidden="true" />
              )}
              <p className={`m-0 rounded-[13px] px-3 py-[10px] text-[0.74rem] leading-[1.6] [overflow-wrap:anywhere] whitespace-pre-wrap ${message.role === "assistant" ? "rounded-tl-[4px] border border-[#e7eaf1] bg-[#f7f8fb] text-[#41495a]" : "rounded-tr-[4px] bg-[var(--palette-primary)] text-white"}`}>{message.content}</p>
            </div>
          ))
        )}
        {isAssistantLoading && (
          <div className="assistant-message assistant assistant-typing flex max-w-[90%] items-start gap-2 self-start">
            <FontAwesomeIcon icon={faRobot} className="mt-[10px] text-[0.8rem] text-[var(--palette-primary)]" aria-hidden="true" />
            <p className="m-0 rounded-[13px] rounded-tl-[4px] border border-[#e7eaf1] bg-[#f7f8fb] px-3 py-[10px] text-[0.74rem] leading-[1.6] italic text-[#858c9b] [overflow-wrap:anywhere] whitespace-pre-wrap">
              {assistantModelState === "loading"
                ? assistantModelProgress || "Downloading local AI model…"
                : "Thinking…"}
            </p>
          </div>
        )}
        {assistantModelState === "loading" && (
          <div className="assistant-model-loading-bar" aria-label="Loading local model" />
        )}
        {assistantError && (
          <div className="assistant-error rounded-[10px] border border-[#f0c6c7] bg-[#fff5f5] px-[11px] py-[10px] text-[0.7rem] leading-[1.55] text-[#9c3d41]" role="alert">
            <p className="m-0">{assistantError}</p>
            <button className="mt-2 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] font-bold text-[#87373b] hover:underline" type="button" onClick={onRetry}>
              <FontAwesomeIcon icon={faRotateRight} />
              Try again
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="assistant-privacy-note border-t border-[#edf0f5] bg-[#fbfcfe] px-[14px] py-2 text-[0.62rem] leading-[1.5] text-[#828a9a]">
        A compact AI model downloads from Hugging Face the first time you use
        it. Afterward, questions and selected document text are processed
        locally in your browser, not sent to an AI server. WebGPU support is
        required.
      </div>
      <form className="assistant-composer mx-3 mt-[10px] flex items-end gap-2 rounded-[13px] border border-[#dfe3ed] bg-white p-2 shadow-[0_3px_12px_rgb(20_30_55_/_5%)] focus-within:border-[color-mix(in_srgb,var(--palette-primary)_50%,#dfe3ed)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--palette-primary)_12%,transparent)]" onSubmit={onAsk}>
        <textarea
          ref={inputRef}
          className="min-h-[42px] max-h-[120px] flex-1 resize-y border-0 bg-transparent px-[5px] py-1 font-[inherit] text-[0.74rem] leading-[1.5] text-[#30384a] outline-none placeholder:text-[#9aa1af]"
          value={assistantInput}
          onChange={onInputChange}
          placeholder="Ask a question…"
          aria-label="Ask the AI assistant"
          maxLength={4000}
          rows={2}
          disabled={isAssistantLoading}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          className="assistant-send-button grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] border-0 bg-[var(--palette-primary)] text-white disabled:cursor-not-allowed disabled:opacity-[0.45]"
          aria-label="Send question"
          title="Send question"
          disabled={!assistantInput.trim() || isAssistantLoading}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
      <div className="assistant-composer-hint flex justify-between px-4 pt-[5px] pb-[10px] text-[0.59rem] text-[#a0a6b3]">
        <span>Enter to send · Shift + Enter for a new line</span>
        <span>{assistantInput.length}/4000</span>
      </div>
    </aside>
  );
}

export default AssistantPanel;
