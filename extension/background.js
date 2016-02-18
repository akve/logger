/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    id: "desktopCaptureID",
    innerBounds: {
   
     minWidth: 700,
      minHeight: 640,
      maxWidth: 700,
      maxHeight: 640 
    },
	resizable: true,
    singleton: true
  });
});
