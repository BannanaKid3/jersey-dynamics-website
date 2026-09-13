const filters = document.querySelectorAll('[data-filter]');
const cards = document.querySelectorAll('[data-team-category]');

filters.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach((card) => {
      card.hidden = selected !== 'all' && card.dataset.teamCategory !== selected;
    });
  });
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
