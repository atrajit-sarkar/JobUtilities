// Dashboard functionality
class Dashboard {
    constructor() {
        this.initializeAnimations();
        this.bindEvents();
        this.setupContributionNotice();
    }

    setupContributionNotice() {
        // Banner should appear on every page load
        // No localStorage check needed - user requested it to appear on reload
    }

    initializeAnimations() {
        // Add entrance animations
        this.observeElements();
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        // Observe utility cards for animation
        document.querySelectorAll('.utility-card, .stat-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    bindEvents() {
        // Add click handlers for utility cards
        document.querySelectorAll('.utility-card:not(.coming-soon)').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    const href = card.getAttribute('onclick');
                    if (href) {
                        const url = href.match(/'([^']+)'/)[1];
                        window.location.href = url;
                    }
                }
            });
        });

        // Add hover effects for interactive elements
        this.addHoverEffects();
    }

    addHoverEffects() {
        // Add ripple effect to buttons
        document.querySelectorAll('.use-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!btn.disabled) {
                    this.createRipple(e, btn);
                }
            });
        });
    }

    createRipple(event, element) {
        const circle = document.createElement('span');
        const diameter = Math.max(element.clientWidth, element.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - element.offsetLeft - radius}px`;
        circle.style.top = `${event.clientY - element.offsetTop - radius}px`;
        circle.classList.add('ripple');

        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                pointer-events: none;
            }
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);

        const existingRipple = element.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        element.appendChild(circle);

        setTimeout(() => {
            circle.remove();
        }, 600);
    }
}

// Utility functions
function navigateToTool(toolPath) {
    window.location.href = toolPath;
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
    
    // Add some interactive features
    addParallaxEffect();
    addTypingEffect();
});

function addParallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.header');
        const speed = scrolled * 0.5;
        
        if (parallax) {
            parallax.style.transform = `translateY(${speed}px)`;
        }
    });
}

function addTypingEffect() {
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        subtitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                subtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        // Start typing effect after a delay
        setTimeout(typeWriter, 1000);
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'i' for image compressor
    if (e.key === 'i' && !e.ctrlKey && !e.altKey) {
        const imageCard = document.querySelector('[onclick*="image-compressor"]');
        if (imageCard) {
            imageCard.click();
        }
    }
    
    // Press 'p' for PDF compressor
    if (e.key === 'p' && !e.ctrlKey && !e.altKey) {
        const pdfCard = document.querySelector('[onclick*="pdf-compressor"]');
        if (pdfCard) {
            pdfCard.click();
        }
    }
});

// Add search functionality (for future use)
function searchUtilities(query) {
    const cards = document.querySelectorAll('.utility-card');
    const searchTerm = query.toLowerCase();
    
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const tags = Array.from(card.querySelectorAll('.feature-tag'))
            .map(tag => tag.textContent.toLowerCase())
            .join(' ');
        
        const isMatch = title.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       tags.includes(searchTerm);
        
        card.style.display = isMatch ? 'block' : 'none';
    });
}

// Contribution notice functions
function scrollToContribution() {
    const opensourceSection = document.querySelector('.opensource-section');
    if (opensourceSection) {
        opensourceSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function closeNotice() {
    const banner = document.querySelector('.contribution-notice-banner');
    if (banner) {
        banner.style.animation = 'slideUp 0.5s ease-out forwards';
        setTimeout(() => {
            banner.style.display = 'none';
            // Notice will reappear on page reload as requested
        }, 500);
    }
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Dashboard, searchUtilities };
}
