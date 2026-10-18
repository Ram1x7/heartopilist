// Read-only bridge from the classic-script editor to the lazy ES-module viewer.
// No changes to drafts, saved designs, or share-code v1.
(function () {
  'use strict';
  const roles = Object.freeze({
    front: { id: 'default', label: '前面', width: 64, height: 80 },
    back: { id: 'canvas-1777194719606', label: '背面', width: 64, height: 80 },
    leftSleeve: { id: 'canvas-1777197309890', label: '左袖', width: 64, height: 48 },
    rightSleeve: { id: 'canvas-1777198784026', label: '右袖', width: 64, height: 48 }
  });
  let viewer = null, opening = false, generation = 0;
  const button = document.getElementById('art3DOpenBtn');
  function available() {
    return typeof activeFrameId !== 'undefined' && activeFrameId === 't_shirt' &&
      Object.values(roles).some(role => role.id === activePartId);
  }
  function valid(design, role) {
    return design && design.frameId === 't_shirt' && design.partId === role.id &&
      design.width === role.width && design.height === role.height &&
      Array.isArray(design.pixelData) && design.pixelData.length === role.width * role.height &&
      design.pixelData.every(c => c === null || /^#[0-9a-f]{6}$/i.test(c));
  }
  function currentRole() { return Object.keys(roles).find(key => roles[key].id === activePartId); }
  function getPart(key, selection) {
    const role = roles[key];
    const design = key === currentRole() ? {
      frameId: activeFrameId, partId: activePartId, width: gridWidth, height: gridHeight, pixelData: pixels
    } : savedDesigns.find(d => d.id === selection);
    const mask = PRESET_MASKS.t_shirt[role.id];
    return {
      width: role.width, height: role.height,
      pixels: valid(design, role) ? design.pixelData : null,
      maskLines: mask.maskLines, source: key === currentRole() ? 'current' : valid(design, role) ? 'saved' : 'blank'
    };
  }
  const bridge = {
    roles,
    activeRole: currentRole,
    candidates(key) { return savedDesigns.filter(d => valid(d, roles[key])).map(d => ({ id: d.id, name: d.name || 'デザイン' })); },
    snapshot(selections) {
      if(!available()) return null;
      return Object.fromEntries(Object.keys(roles).map(key => [key, getPart(key, selections[key])]));
    }
  };
  function refresh() {
    button.hidden = !available();
    if(!available()) { generation++; if(viewer) viewer.close(); return; }
    if(viewer) viewer.update();
  }
  button.addEventListener('click', async () => {
    if(opening || viewer || !available()) return;
    opening = true; button.disabled = true;
    const ticket = ++generation;
    try {
      const { openPreview } = await import('./art-3d-preview.js?v=1');
      if(ticket !== generation || !available()) return;
      viewer = openPreview(bridge, () => { viewer = null; button.focus(); });
    } catch(error) {
      console.warn('3D preview could not be loaded', error);
      if(typeof showToast === 'function') showToast('3Dを読み込めませんでした。オンラインでページを開き直してください。');
    } finally { opening = false; button.disabled = false; }
  });
  window.HatopiArt3D = Object.freeze({ refresh });
})();
