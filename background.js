chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    
    'innerBounds': {
      'width': 360,
      'height': 700,
      'left':1000,
      'top':25
    },
    frame: { color: '#0000ff' }
  });
});