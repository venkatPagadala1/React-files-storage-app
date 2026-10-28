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
        className="assistant-launcher"
        onClick={onOpen}
        aria-label="Open AI assistant"
        title="Ask VSR AI"
      >
        <FontAwesomeIcon icon={faRobot} />
        <span>Ask AI</span>
      </button>
    );
  }

  return (
    <aside
      className="assistant-panel"
      aria-label="AI assistance"
      aria-live="polite"
    >
      <header className="assistant-panel-header">
        <div className="assistant-brand-icon">
          <FontAwesomeIcon icon={faRobot} />
        </div>
        <div className="assistant-title-copy">
          <strong>VSR AI assistant</strong>
          <span>
            <i className={assistantModelState === "ready" ? "assistant-status-online" : ""} />
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
          className="icon-button assistant-close-button"
          aria-label="Close AI assistant"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      <div className="assistant-context-note">
        <FontAwesomeIcon icon={faFileLines} />
        <span>
          {activeItem
            ? `Context: ${activeItem.title}`
            : "Ask about the workspace or your open document"}
        </span>
      </div>

      <div className="assistant-messages" role="log" aria-label="Conversation">
        {assistantMessages.length === 0 ? (
          <div className="assistant-welcome">
            <span className="assistant-welcome-mark">
              <FontAwesomeIcon icon={faRobot} />
            </span>
            <h2>What can I help with?</h2>
            <p>Ask about the workspace or get help understanding the selected document.</p>
            <div className="assistant-suggestions">
              {[
                "How do I organize my documents?",
                activeItem ? "Summarize the selected document" : "What can this workspace do?",
              ].map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
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
              className={`assistant-message ${message.role}`}
              key={`${message.role}-${index}`}
            >
              {message.role === "assistant" && (
                <FontAwesomeIcon icon={faRobot} aria-hidden="true" />
              )}
              <p>{message.content}</p>
            </div>
          ))
        )}
        {isAssistantLoading && (
          <div className="assistant-message assistant assistant-typing">
            <FontAwesomeIcon icon={faRobot} aria-hidden="true" />
            <p>
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
          <div className="assistant-error" role="alert">
            <p>{assistantError}</p>
            <button type="button" onClick={onRetry}>
              <FontAwesomeIcon icon={faRotateRight} />
              Try again
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="assistant-privacy-note">
        A compact AI model downloads from Hugging Face the first time you use
        it. Afterward, questions and selected document text are processed
        locally in your browser, not sent to an AI server. WebGPU support is
        required.
      </div>
      <form className="assistant-composer" onSubmit={onAsk}>
        <textarea
          ref={inputRef}
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
          className="assistant-send-button"
          aria-label="Send question"
          title="Send question"
          disabled={!assistantInput.trim() || isAssistantLoading}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
      <div className="assistant-composer-hint">
        <span>Enter to send · Shift + Enter for a new line</span>
        <span>{assistantInput.length}/4000</span>
      </div>
    </aside>
  );
}

export default AssistantPanel;
