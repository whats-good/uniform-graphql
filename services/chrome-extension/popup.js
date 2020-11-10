chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const currentUrl = new URL(tabs[0].url);
  const currentPathname = currentUrl.pathname;
  const splitPaths = currentPathname.split('/');
  if (splitPaths.length >= 3 && splitPaths[1] === 'channel') {
    const channelId = splitPaths[2];
    const newUrl = new URL(
      `http://localhost:4002/?action=display&bridge=Youtube&context=By+channel+id&c=${channelId}&duration_min=&duration_max=&format=Atom`,
    );
    chrome.tabs.create({ url: newUrl.toString() });
  }
});
