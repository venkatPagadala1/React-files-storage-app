import { CreateMLCEngine } from "@mlc-ai/web-llm";

let engine;

self.onmessage = async ({ data }) => {
  const { requestId, type } = data;

  try {
    if (type === "initialize") {
      engine = await CreateMLCEngine(data.modelId, {
        initProgressCallback: (progress) => {
          self.postMessage({
            requestId,
            type: "progress",
            text: progress.text,
          });
        },
      });
      self.postMessage({ requestId, type: "complete" });
      return;
    }

    if (type === "chat") {
      if (!engine) throw new Error("The local AI model has not been initialized.");

      const stream = await engine.chat.completions.create({
        messages: data.messages,
        stream: true,
        temperature: data.temperature,
        max_tokens: data.maxTokens,
      });

      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content;
        if (typeof token === "string" && token) {
          self.postMessage({ requestId, type: "token", token });
        }
      }
      self.postMessage({ requestId, type: "complete" });
    }
  } catch (error) {
    self.postMessage({
      requestId,
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
