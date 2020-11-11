chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const currentUrl = new URL(tabs[0].url);
  const currentPathname = currentUrl.pathname;
  const splitPaths = currentPathname.split('/');
  if (splitPaths.length >= 3 && splitPaths[1] === 'channel') {
    const channelId = splitPaths[2];
    const newUrl = new URL(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    );
    chrome.tabs.create({ url: newUrl.toString() });
  }
});
