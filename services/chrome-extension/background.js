chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ color: '#3aa757' }, function () {
    console.log('The color is green');
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: 'www.youtube.com' },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});

// https://developer.chrome.com/extensions/declarativeContent
// https://developer.chrome.com/extensions/pageAction
// https://chromium.googlesource.com/chromium/src/+/master/chrome/common/extensions/docs/examples/api/pageAction/pageaction_by_url/background.js
