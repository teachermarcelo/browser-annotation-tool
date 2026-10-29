async function toggleAnnotator(tab) {
  if (!tab?.id || !tab.url) return;
  const blocked = ["chrome://", "edge://", "about:", "devtools://", "chrome-extension://", "https://chrome.google.com/webstore"];
  if (blocked.some(prefix => tab.url.startsWith(prefix))) return;
  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content.css"] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
  } catch (error) {
    console.warn("Teacher Annotate Pro: não foi possível ativar nesta página.", error);
  }
}
chrome.action.onClicked.addListener(toggleAnnotator);
chrome.commands.onCommand.addListener(async command => {
  if (command !== "toggle-annotation-toolbar") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await toggleAnnotator(tab);
});