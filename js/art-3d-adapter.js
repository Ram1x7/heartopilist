// Read-only bridge from the classic-script editor to the lazy ES-module viewer.
// No changes to drafts, saved designs, or share-code v1.
(function () {
  'use strict';
  const catalog = {
    t_shirt: ['tshirt', ['front','back','sleeve','sleeveR']],
    tank_top: ['tank', ['front','back']],
    mini_skirt: ['skirt', ['front','back']],
    shorts: ['shorts', ['front','back']],
    bucket_hat: ['bucketHat', ['front','back','top']],
    sweatshirt: ['sweatshirt', ['front','back','sleeve']],
    pants: ['pants', ['front','back']],
    dress: ['dress', ['front','back','inner']],
    cap: ['cap', ['front','back','top']],
    shoes: ['shoes', ['front','back','top']],
    mary_jane: ['maryJane', ['front','top']]
  };
  let viewer = null, opening = false, generation = 0, openedFrame = null;
  const button = document.getElementById('art3DOpenBtn');
  function configuration() {
    if(typeof activeFrameId === 'undefined' || !catalog[activeFrameId]) return null;
    const frame = DESIGN_FRAME_PRESETS.find(frame => frame.id === activeFrameId);
    if(!frame) return null;
    const [kind, names] = catalog[frame.id];
    const roles = Object.fromEntries(frame.parts.map((part, index) => [names[index], {
      id: part.id, label: part.name, width: part.width, height: part.height
    }]));
    return {frameId:frame.id, title:frame.name, kind, roles};
  }
  function available() {
    const config = configuration();
    return !!config && Object.values(config.roles).some(role => role.id === activePartId);
  }
  function valid(design, role) {
    return design && design.frameId === activeFrameId && design.partId === role.id &&
      design.width === role.width && design.height === role.height &&
      Array.isArray(design.pixelData) && design.pixelData.length === role.width * role.height &&
      design.pixelData.every(c => c === null || /^#[0-9a-f]{6}$/i.test(c));
  }
  function currentRole() { return Object.keys(configuration().roles).find(key => configuration().roles[key].id === activePartId); }
  function getPart(key, selection) {
    const role = configuration().roles[key];
    const design = key === currentRole() ? {
      frameId: activeFrameId, partId: activePartId, width: gridWidth, height: gridHeight, pixelData: pixels
    } : savedDesigns.find(d => d.id === selection);
    const mask = PRESET_MASKS[activeFrameId][role.id];
    return {
      width: role.width, height: role.height,
      pixels: valid(design, role) ? design.pixelData : null,
      maskLines: mask.maskLines, source: key === currentRole() ? 'current' : valid(design, role) ? 'saved' : 'blank'
    };
  }
  const bridge = {
    get roles() { return configuration().roles; },
    get kind() { return configuration().kind; },
    get title() { return configuration().title; },
    activeRole: currentRole,
    candidates(key) { return savedDesigns.filter(d => valid(d, configuration().roles[key])).map(d => ({ id: d.id, name: d.name || 'デザイン' })); },
    snapshot(selections) {
      if(!available() || (openedFrame && openedFrame !== activeFrameId)) return null;
      return Object.fromEntries(Object.keys(configuration().roles).map(key => [key, getPart(key, selections[key])]));
    }
  };
  function refresh() {
    button.hidden = !available();
    if(!available() || (openedFrame && openedFrame !== activeFrameId)) {
      generation++; if(viewer) viewer.close(); viewer = null; openedFrame = null; return;
    }
    if(viewer) viewer.update();
  }
  button.addEventListener('click', async () => {
    if(opening || viewer || !available()) return;
    opening = true; button.disabled = true;
    const ticket = ++generation, requestedFrame = activeFrameId;
    try {
      const { openPreview, loadPreviewStyles } = await import('./art-3d-preview.js?v=6');
      await loadPreviewStyles();
      if(ticket !== generation || !available() || requestedFrame !== activeFrameId) return;
      openedFrame = requestedFrame;
      viewer = openPreview(bridge, () => { viewer = null; openedFrame = null; button.focus(); });
    } catch(error) {
      console.warn('3D preview could not be loaded', error);
      if(typeof showToast === 'function') showToast('3Dを読み込めませんでした。オンラインでページを開き直してください。');
    } finally { opening = false; button.disabled = false; }
  });
  window.HatopiArt3D = Object.freeze({ refresh });
})();
