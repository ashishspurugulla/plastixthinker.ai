// Microbot logic
window.addEventListener('DOMContentLoaded', function() {
  const microbotBubble = document.getElementById('microbot-bubble');
  const microbotIcon = document.getElementById('microbot-icon');
  const microbotImg = document.getElementById('microbot-img');
  const microbotClose = document.getElementById('microbot-close');
  let microbotShown = false;

  // Add waving animation to the image
  microbotImg.id = 'wave';

  // Toggle bubble on icon click
  microbotIcon.onclick = function() {
    microbotBubble.style.display = microbotBubble.style.display === 'none' ? 'block' : 'none';
  };

  // Close button
  microbotClose.onclick = function(e) {
    microbotBubble.style.display = 'none';
    e.stopPropagation();
  };

  // Show bubble on first Ask
  const askBtn = document.getElementById('ask-btn');
  if (askBtn) {
    askBtn.addEventListener('click', function() {
      if (!microbotShown) {
        microbotBubble.style.display = 'block';
        microbotShown = true;
      }
    });
  }
}); 