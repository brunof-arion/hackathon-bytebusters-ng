chrome.tabs.onUpdated.addListener((tabId, changeInfo, { url }) => {
    if (url?.includes("linkedin.com/in")) {
        const linkedInProfileId = url.split("in/")[1];

        // send a message to contentScript.js
        chrome.tabs.sendMessage(tabId, {
            type: "NEW",
            linkedInProfileId: decodeURIComponent(linkedInProfileId.replace('/', ''))
        });
    }
});
