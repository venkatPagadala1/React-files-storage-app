import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const engineHandler = new WebWorkerMLCEngineHandler();
self.onmessage = engineHandler.onmessage.bind(engineHandler);
