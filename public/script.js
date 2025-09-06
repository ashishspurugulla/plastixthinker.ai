// Microbot logic
window.addEventListener('DOMContentLoaded', function() {
  const microbotBubble = document.getElementById('microbot-bubble');
  const microbotIcon = document.getElementById('microbot-icon');
  const microbotImg = document.getElementById('microbot-img');
  const microbotClose = document.getElementById('microbot-close');
  
  // Only run microbot code if we're on a page with microbot elements
  if (microbotBubble && microbotIcon && microbotImg && microbotClose) {
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
  }
});

// Help Center functionality
document.addEventListener('DOMContentLoaded', function() {
  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // FAQ Toggle
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  if (faqQuestions.length > 0) {
    faqQuestions.forEach(question => {
      question.addEventListener('click', function() {
        const answer = this.nextElementSibling;
        const isActive = answer.classList.contains('active');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-answer').forEach(item => {
          item.classList.remove('active');
        });
        document.querySelectorAll('.faq-question').forEach(item => {
          item.classList.remove('active');
        });
        
        // Toggle current item
        if (!isActive) {
          answer.classList.add('active');
          this.classList.add('active');
        }
      });
    });
  }

  // Intersection Observer for fade-in animations
  const fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length > 0) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all fade-in elements
    fadeElements.forEach(el => observer.observe(el));
  }

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
});

// About page animation functionality
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.querySelector('.background');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let dots = [];
    
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    function randomColor() {
      const colors = [
        '#ffffff', // white
        '#e6f7ff', // light blue
        '#b3e0ff', // baby blue
        '#f7cfff', // light pink
        '#c7f7e6', // light green
        '#f7f7cf', // light yellow
        '#d1cfff'  // light purple
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
    
    function createDots() {
      dots = [];
      const count = Math.floor(window.innerWidth / 20);
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 2 + Math.random() * 4,
          color: randomColor(),
          speed: 0.2 + Math.random() * 0.5,
          drift: (Math.random() - 0.5) * 0.2
        });
      }
    }
    
    createDots();
    window.addEventListener('resize', createDots);
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let dot of dots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, 2 * Math.PI);
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        dot.y -= dot.speed;
        dot.x += dot.drift;
        if (dot.y < -10) {
          dot.y = canvas.height + 10;
          dot.x = Math.random() * canvas.width;
        }
        if (dot.x < -10) dot.x = canvas.width + 10;
        if (dot.x > canvas.width + 10) dot.x = -10;
      }
      requestAnimationFrame(animate);
    }
    
    animate();
  }
});

// Contact page functionality
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // Create email body
      const emailBody = `
        Name: ${data.firstName} ${data.lastName}
        Email: ${data.email}
        Phone: ${data.phone || 'Not provided'}
        Subject: ${data.subject}
        
        Message:
        ${data.message}
      `;
      
      // Open email client with pre-filled content
      const mailtoLink = `mailto:plastixtinker@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink);
      
      // Show success message
      alert('Thank you for your message! We\'ll get back to you soon.');
      this.reset();
    });
  }
}); 