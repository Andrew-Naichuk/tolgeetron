import type { MainToUiMessage, UiToMainMessage } from "./types";

/** Send a typed message from the UI (iframe) to the plugin sandbox. */
export function postToMain(message: UiToMainMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

/** Send a typed message from the plugin sandbox to the UI (iframe). */
export function postToUi(message: MainToUiMessage): void {
  figma.ui.postMessage(message);
}

/** Subscribe to typed messages from the plugin sandbox, for use in the UI. */
export function onMessageFromMain(
  handler: (message: MainToUiMessage) => void
): () => void {
  const listener = (event: MessageEvent) => {
    const message = event.data?.pluginMessage as MainToUiMessage | undefined;
    if (message) handler(message);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

/** Subscribe to typed messages from the UI, for use in the plugin sandbox. */
export function onMessageFromUi(
  handler: (message: UiToMainMessage) => void
): void {
  figma.ui.onmessage = (message: UiToMainMessage) => handler(message);
}
