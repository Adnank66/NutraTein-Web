const videoPlayer = document.querySelector('[data-video-player]');
const cartMessage = document.querySelector('[data-cart-message]');

// Autoplay is muted to meet modern browser autoplay rules; the video loops continuously.
videoPlayer.muted = true;
videoPlayer.addEventListener('canplay', () => videoPlayer.play().catch(() => {}), { once: true });

document.querySelectorAll('[data-add-cart]').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.dataset.addCart;
    const originalLabel = button.textContent;
    button.textContent = 'Added ✓';
    button.disabled = true;
    cartMessage.textContent = `${item} has been added to your cart.`;
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.disabled = false;
    }, 1800);
  });
});
