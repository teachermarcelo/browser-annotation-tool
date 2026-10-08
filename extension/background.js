chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id || !tab.url) return;

  const blocked = /^(chrome|edge|about|devtools|chrome-extension):\\/\\//i.test(tab.url);
  if (blocked) return;

  try {
    const data = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });

    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content.css"]
    }).catch(() => {});

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    await chrome.tabs.sendMessage(tab.id, {
      type: "BROWSER_ANNOTATION_CAPTURE",
      data
    });
  } catch (error) {
    console.warn("Browser Annotation Tool:", error);
  }
});