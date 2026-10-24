(() => {
  const article = document.querySelector('.article-entry');
  const markers = article ? [...article.querySelectorAll(':scope > .article-page-break')] : [];

  if (!article || !document.querySelector('#article-nav') || markers.length < 2) return;

  const slugify = (value, index) => {
    const slug = value.toLowerCase()
      .trim()
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-|-$/g, '');
    return slug || `part-${index + 1}`;
  };

  const allNodes = [...article.childNodes];
  const pages = [];
  let currentPage = null;

  allNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('article-page-break')) {
      const title = node.dataset.pageTitle;
      const section = document.createElement('section');
      section.className = 'article-page';
      section.dataset.title = title;
      section.id = `chapter-${slugify(title, pages.length)}`;
      section.setAttribute('role', 'tabpanel');
      node.replaceWith(section);
      pages.push(section);
      currentPage = section;
      return;
    }
    if (currentPage) currentPage.append(node);
  });

  const nav = document.createElement('nav');
  nav.className = 'article-page-nav';
  nav.setAttribute('aria-label', '文章章节');
  nav.innerHTML = '<span class="article-page-nav__label">文章章节</span><div class="article-page-tabs" role="tablist"></div>';
  const tabList = nav.querySelector('.article-page-tabs');

  const footer = document.createElement('div');
  footer.className = 'article-page-footer';
  footer.innerHTML = `
    <button class="article-page-button article-page-button--prev" type="button">← 上一节</button>
    <span class="article-page-status" aria-live="polite"></span>
    <button class="article-page-button article-page-button--next" type="button">下一节 →</button>
  `;

  const tabs = pages.map((page, index) => {
    const button = document.createElement('button');
    button.className = 'article-page-tab';
    button.type = 'button';
    button.role = 'tab';
    button.textContent = page.dataset.title;
    button.setAttribute('aria-controls', page.id);
    button.addEventListener('click', () => showPage(index, true, true));
    tabList.append(button);
    return button;
  });

  article.insertBefore(nav, pages[0]);
  article.append(footer);

  const previous = footer.querySelector('.article-page-button--prev');
  const next = footer.querySelector('.article-page-button--next');
  const status = footer.querySelector('.article-page-status');
  let activeIndex = 0;

  function showPage(index, updateHistory = false, shouldScroll = false) {
    activeIndex = Math.max(0, Math.min(index, pages.length - 1));
    pages.forEach((page, pageIndex) => {
      const active = pageIndex === activeIndex;
      page.hidden = !active;
      page.setAttribute('aria-hidden', String(!active));
      tabs[pageIndex].setAttribute('aria-selected', String(active));
      tabs[pageIndex].tabIndex = active ? 0 : -1;
    });
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === pages.length - 1;
    previous.textContent = activeIndex > 0 ? `← ${pages[activeIndex - 1].dataset.title}` : '← 上一节';
    next.textContent = activeIndex < pages.length - 1 ? `${pages[activeIndex + 1].dataset.title} →` : '下一节 →';
    status.textContent = `${activeIndex + 1} / ${pages.length}`;
    tabs[activeIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });

    if (updateHistory) history.pushState({ articlePage: activeIndex }, '', `#${pages[activeIndex].id}`);
    if (shouldScroll) nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  previous.addEventListener('click', () => showPage(activeIndex - 1, true, true));
  next.addEventListener('click', () => showPage(activeIndex + 1, true, true));
  tabList.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0
      : event.key === 'End' ? pages.length - 1
      : activeIndex + (event.key === 'ArrowRight' ? 1 : -1);
    showPage(target, true, false);
    tabs[activeIndex].focus();
  });

  window.addEventListener('popstate', () => {
    const index = pages.findIndex((page) => `#${page.id}` === location.hash);
    showPage(index >= 0 ? index : 0, false, false);
  });

  const initialIndex = pages.findIndex((page) => `#${page.id}` === location.hash);
  showPage(initialIndex >= 0 ? initialIndex : 0, false, false);
})();
