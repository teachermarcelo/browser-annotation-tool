chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id || !tab.url) return;

  // Chrome/Edge internal pages do not allow extensions to draw over them.
  const blocked = /^(chrome|edge|about|devtools|chrome-extension):\/\//i.test(tab.url);
  if (blocked) return;

  try {
    const data = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    await chrome.tabs.sendMessage(tab.id, {
      type: "BROWSER_ANNOTATION_CAPTURE",
      data
    });
  } catch (error) {
    // Avoid leaving an extension error on pages where Chrome blocks access.
    console.warn("Browser Annotation Tool: página não disponível para anotação.", error);
  }
});