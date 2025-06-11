chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "searchWithGemini",
        title: "Search with Gemini",
        contexts: ["selection"],
    });

    chrome.storage.sync.get(["apiKey"], (results) => {
        if (!results.apiKey) {
            chrome.tabs.create({ url: "options.html" });
        }
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "searchWithGemini") {
        chrome.tabs.sendMessage(tab.id, {
            type: "showGeminiPopup",
            text: info.selectionText,
        });
    }
});
