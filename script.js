const tocBox = document.getElementById('toc');
const tocList = document.getElementById('tocList');
const tocToggle = document.getElementById('tocToggle');

// h2와 h3를 읽어 1 / 1.1 구조의 목차를 자동 생성합니다.
const headings = [...document.querySelectorAll('.document-content h2, .document-content h3')];
let currentSubList = null;

headings.forEach((heading) => {
  if (!heading.id) {
    const parent = heading.closest('section');
    if (heading.tagName === 'H2' && parent?.id) heading.id = parent.id;
  }

  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `#${heading.id}`;
  link.textContent = heading.textContent.trim();
  item.appendChild(link);

  if (heading.tagName === 'H2') {
    tocList.appendChild(item);
    currentSubList = document.createElement('ol');
    item.appendChild(currentSubList);
  } else if (currentSubList) {
    currentSubList.appendChild(item);
  }
});

[...tocList.querySelectorAll('ol')].forEach((list) => {
  if (!list.children.length) list.remove();
});

tocToggle?.addEventListener('click', () => {
  const collapsed = tocBox.classList.toggle('collapsed');
  tocToggle.textContent = collapsed ? '펼치기' : '접기';
  tocToggle.setAttribute('aria-expanded', String(!collapsed));
});

// 데뷔일 기준 D+를 자동으로 갱신합니다. 데뷔 당일은 D+0으로 계산합니다.
const debutDays = document.getElementById('debutDays');
if (debutDays) {
  const debut = new Date('2026-04-29T00:00:00+09:00');
  const now = new Date();
  const koreaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const todayUtc = Date.UTC(koreaNow.getFullYear(), koreaNow.getMonth(), koreaNow.getDate());
  const debutUtc = Date.UTC(2026, 3, 29);
  const diff = Math.max(1, Math.floor((todayUtc - debutUtc) / 86400000)+1);
  debutDays.textContent = diff.toLocaleString('ko-KR');
}

// 마인크래프트 서버 시작일 전후로 문구를 자동 전환합니다.
const minecraftPeriodLabel = document.getElementById('minecraftPeriodLabel');
const minecraftStatusText = document.getElementById('minecraftStatusText');
if (minecraftPeriodLabel && minecraftStatusText) {
  const koreaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const start = new Date(2026, 8, 20);
  if (koreaNow >= start) {
    minecraftPeriodLabel.textContent = '운영 기간:';
    minecraftStatusText.textContent = '2026년 9월 20일부터 시청자 참여형으로 진행되는 《마인크래프트》 서버.';
  }
}


// 각주 번호를 누르면 본문 이동 대신 작은 팝업으로 내용을 보여줍니다.
const footnoteLinks = [...document.querySelectorAll('.footnote-ref a[href^="#fn-"]')];
let activeFootnoteLink = null;

const footnotePopover = document.createElement('div');
footnotePopover.className = 'footnote-popover';
footnotePopover.id = 'footnotePopover';
footnotePopover.setAttribute('role', 'dialog');
footnotePopover.setAttribute('aria-modal', 'false');
footnotePopover.setAttribute('aria-hidden', 'true');
footnotePopover.innerHTML = `
  <div class="footnote-popover-head">
    <strong class="footnote-popover-title">각주</strong>
    <button class="footnote-popover-close" type="button" aria-label="각주 닫기">×</button>
  </div>
  <div class="footnote-popover-body"></div>
`;
document.body.appendChild(footnotePopover);

const footnotePopoverTitle = footnotePopover.querySelector('.footnote-popover-title');
const footnotePopoverBody = footnotePopover.querySelector('.footnote-popover-body');
const footnotePopoverClose = footnotePopover.querySelector('.footnote-popover-close');

function closeFootnotePopover({ returnFocus = false } = {}) {
  if (!footnotePopover.classList.contains('show')) return;
  footnotePopover.classList.remove('show');
  footnotePopover.setAttribute('aria-hidden', 'true');
  activeFootnoteLink?.setAttribute('aria-expanded', 'false');
  if (returnFocus) activeFootnoteLink?.focus();
  activeFootnoteLink = null;
}

function getFootnoteContent(targetId) {
  const note = document.getElementById(targetId);
  if (!note) return '';

  const clone = note.cloneNode(true);

  clone.querySelectorAll('.back-ref').forEach((backRef) => {
    backRef.remove();
  });

  return clone.innerHTML.trim();
}

function positionFootnotePopover(link) {
  const rect = link.getBoundingClientRect();
  const gap = 8;
  const viewportPadding = 12;

  // 모바일에서는 읽기 편하도록 화면 하단에 고정된 작은 메모창으로 표시합니다.
  if (window.matchMedia('(max-width: 640px)').matches) {
    footnotePopover.style.left = `${viewportPadding}px`;
    footnotePopover.style.right = `${viewportPadding}px`;
    footnotePopover.style.top = 'auto';
    footnotePopover.style.bottom = `${viewportPadding}px`;
    return;
  }

  footnotePopover.style.right = 'auto';
  footnotePopover.style.bottom = 'auto';
  footnotePopover.style.left = '0px';
  footnotePopover.style.top = '0px';

  const popoverRect = footnotePopover.getBoundingClientRect();
  let left = rect.left;
  let top = rect.bottom + gap;

  if (left + popoverRect.width > window.innerWidth - viewportPadding) {
    left = window.innerWidth - popoverRect.width - viewportPadding;
  }
  left = Math.max(viewportPadding, left);

  if (top + popoverRect.height > window.innerHeight - viewportPadding) {
    top = rect.top - popoverRect.height - gap;
  }
  top = Math.max(viewportPadding, top);

  footnotePopover.style.left = `${Math.round(left)}px`;
  footnotePopover.style.top = `${Math.round(top)}px`;
}

footnoteLinks.forEach((link) => {
  link.setAttribute('aria-haspopup', 'dialog');
  link.setAttribute('aria-expanded', 'false');

  link.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (activeFootnoteLink === link && footnotePopover.classList.contains('show')) {
      closeFootnotePopover();
      return;
    }

    activeFootnoteLink?.setAttribute('aria-expanded', 'false');
    activeFootnoteLink = link;

    const targetId = link.getAttribute('href').slice(1);
    const number = link.textContent.trim();
    const content = getFootnoteContent(targetId);

    footnotePopoverTitle.textContent = `각주 ${number}`;
    footnotePopoverBody.innerHTML =
      content || '각주 내용을 찾을 수 없습니다.';
    footnotePopover.classList.add('show');
    footnotePopover.setAttribute('aria-hidden', 'false');
    link.setAttribute('aria-expanded', 'true');

    requestAnimationFrame(() => positionFootnotePopover(link));
  });
});

footnotePopoverClose?.addEventListener('click', () => {
  closeFootnotePopover({ returnFocus: true });
});

footnotePopover.addEventListener('click', (event) => {
  event.stopPropagation();
});

document.addEventListener('click', () => closeFootnotePopover());
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeFootnotePopover({ returnFocus: true });
});

window.addEventListener('resize', () => {
  if (activeFootnoteLink && footnotePopover.classList.contains('show')) {
    positionFootnotePopover(activeFootnoteLink);
  }
});

window.addEventListener('scroll', () => {
  if (activeFootnoteLink && footnotePopover.classList.contains('show')) {
    positionFootnotePopover(activeFootnoteLink);
  }
}, { passive: true });

const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  toTop?.classList.toggle('show', window.scrollY > 600);
}, { passive: true });

toTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
