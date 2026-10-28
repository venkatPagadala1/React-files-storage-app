import { useEffect, useRef, useState } from "react";
import {
  getFilePreviewType,
  highlightDocxText,
} from "../../../lib/workspaceUtils.js";

function useFilePreview({ activeItem, previewSearch, onError }) {
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [fileDocumentText, setFileDocumentText] = useState("");
  const [isLoadingFileDocument, setIsLoadingFileDocument] = useState(false);
  const [isRenderingDocx, setIsRenderingDocx] = useState(false);
  const fileDocumentLoadRef = useRef(0);
  const docxPreviewRef = useRef(null);
  const onErrorRef = useRef(onError);
  const previewType =
    activeItem?.kind === "file" ? getFilePreviewType(activeItem) : "unsupported";

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  useEffect(() => {
    const previewElement = docxPreviewRef.current;
    if (!previewElement || activeItem?.kind !== "file" || previewType !== "docx") {
      setIsRenderingDocx(false);
      return undefined;
    }

    let cancelled = false;
    const renderContainer = document.createElement("div");
    const styleContainer = document.createElement("div");
    previewElement.replaceChildren();
    setIsRenderingDocx(true);

    async function renderDocument() {
      try {
        const { renderAsync } = await import("docx-preview");
        await renderAsync(activeItem.blob, renderContainer, styleContainer, {
          ignoreWidth: true,
          renderAltChunks: false,
          useBase64URL: true,
        });
        if (!cancelled) {
          previewElement.replaceChildren(
            ...Array.from(styleContainer.childNodes),
            ...Array.from(renderContainer.childNodes),
          );
        }
      } catch (error) {
        if (!cancelled) {
          onErrorRef.current(`Could not render "${activeItem.title}": ${error.message}`);
        }
      } finally {
        if (!cancelled) setIsRenderingDocx(false);
      }
    }

    void renderDocument();
    return () => {
      cancelled = true;
      previewElement.replaceChildren();
    };
  }, [activeItem, previewType]);

  useEffect(() => {
    if (
      docxPreviewRef.current &&
      activeItem?.kind === "file" &&
      previewType === "docx" &&
      !isRenderingDocx
    ) {
      highlightDocxText(docxPreviewRef.current, previewSearch);
    }
  }, [activeItem, isRenderingDocx, previewSearch, previewType]);

  function createFilePreviewUrl(item) {
    const itemPreviewType = getFilePreviewType(item);
    if (
      item.kind !== "file" ||
      ["unsupported", "text", "docx"].includes(itemPreviewType)
    ) {
      return "";
    }
    if (!(item.blob instanceof Blob)) {
      onErrorRef.current(
        `Could not preview "${item.title}" because its stored file data is unavailable.`,
      );
      return "";
    }
    return URL.createObjectURL(item.blob);
  }

  async function loadFileDocument(item) {
    const requestId = ++fileDocumentLoadRef.current;
    const itemPreviewType = getFilePreviewType(item);
    setFileDocumentText("");
    setIsLoadingFileDocument(
      itemPreviewType === "text" || itemPreviewType === "docx",
    );
    if (!["text", "docx"].includes(itemPreviewType)) return;

    try {
      if (!(item.blob instanceof Blob)) {
        throw new Error("The stored file data is unavailable.");
      }

      let content;
      if (itemPreviewType === "docx") {
        const mammothModule = await import("mammoth/mammoth.browser.js");
        const mammoth = mammothModule.default ?? mammothModule;
        const result = await mammoth.extractRawText({
          arrayBuffer: await item.blob.arrayBuffer(),
        });
        content = result.value;
      } else {
        content = await item.blob.text();
      }

      if (fileDocumentLoadRef.current === requestId) {
        setFileDocumentText(content);
      }
    } catch (error) {
      if (fileDocumentLoadRef.current === requestId) {
        onErrorRef.current(`Could not preview "${item.title}": ${error.message}`);
      }
    } finally {
      if (fileDocumentLoadRef.current === requestId) {
        setIsLoadingFileDocument(false);
      }
    }
  }

  function clearFileDocument() {
    fileDocumentLoadRef.current += 1;
    setFileDocumentText("");
    setIsLoadingFileDocument(false);
  }

  return {
    filePreviewUrl,
    setFilePreviewUrl,
    fileDocumentText,
    setFileDocumentText,
    isLoadingFileDocument,
    isRenderingDocx,
    docxPreviewRef,
    previewType,
    createFilePreviewUrl,
    loadFileDocument,
    clearFileDocument,
  };
}

export default useFilePreview;
