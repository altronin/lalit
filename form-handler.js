// Contact form submission with Formspree
document.getElementById('contactForm').addEventListener('submit', function(e) {
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Form will be handled by Formspree, but we'll show success message after submission
    setTimeout(function() {
        alert('Thank you for your message! I will get back to you soon.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1000);
});