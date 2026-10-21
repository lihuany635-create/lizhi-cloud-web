(function () {
  if (location.origin !== 'https://localhost') return;
  const original = HTMLAnchorElement.prototype.click;
  function forward(link) {
    if (typeof window.top.LizhiMobile?.saveExport !== 'function') return false;
    if (!link.hasAttribute('download') || !link.href.startsWith('blob:https://localhost/')) return false;
    // Fetch while the creating document still owns the URL; many exporters revoke it immediately.
    const blob = fetch(link.href).then(response => response.blob());
    const name = link.download || '立之雲端庫匯出檔';
    blob.then(value => window.top.LizhiMobile?.saveExport(value, name)).catch(() => {
      alert('匯出失敗，請重試並確認裝置剩餘空間。');
    });
    return true;
  }
  HTMLAnchorElement.prototype.click = function () { if (!forward(this)) original.call(this); };
  document.addEventListener('click', event => {
    const link=event.target.closest?.('a[download]');
    if (link && forward(link)) event.preventDefault();
  },true);
})();
