// Cases share the canonical browser/server lifecycle in toggle-hydration.test.js.
export function registerRenderContracts({it, assert, getPage, loadTestPage}) {
  async function mount(chain = false) {
    await loadTestPage();
    await getPage().evaluate(async chain => {
      globalThis.renderContract = {calls: [], started: [], gates: new Map()};
      setState('RenderContract', {fixtureId: 'contract', render: 'application value', chain, left: 'left-0', right: 'right-0',
        label: 'initial', items: ['a', 'b', 'c'].map(id => ({id}))});
      await use('render-contract');
      const host = document.createElement('render-contract');
      host.setAttribute('state', 'RenderContract');
      document.body.appendChild(host);
    }, chain);
    await waitLabel('initial');
    await getPage().waitForFunction(() => document.querySelector('render-contract').classList.contains('bang-styled'));
  }

  async function waitLabel(label) {
    await getPage().waitForFunction(label => document.querySelector('render-contract')?.shadowRoot
      ?.querySelector('output')?.textContent === label, {timeout: 5000}, label);
  }

  async function click(selector) {
    const point = await getPage().evaluate(selector => {
      const button = document.querySelector('render-contract').shadowRoot.querySelector(selector);
      button.scrollIntoView({block: 'center'});
      const rect = button.getBoundingClientRect();
      return {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2};
    }, selector);
    await getPage().mouse.click(point.x, point.y);
  }

  async function holdOlderRender() {
    await getPage().evaluate(() => {
      const gate = {};
      gate.promise = new Promise(resolve => { gate.resolve = resolve; });
      renderContract.gates.set('older', gate);
      setState('RenderContract', {...getState('RenderContract'), label: 'older', left: 'old-left'});
    });
    await getPage().waitForFunction(() => renderContract.started.includes('older'));
  }

  async function settleOlderRender() {
    await getPage().evaluate(async () => {
      renderContract.gates.get('older').resolve('older');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
  }

  for (const chain of [false, true]) {
    it(`render contract: same-source handlers belong to distinct bindings (chain=${chain})`, async () => {
      await mount(chain);
      for (const generation of [0, 1]) {
        if (generation) {
          await getPage().evaluate(() => setState('RenderContract', {...getState('RenderContract'),
            left: 'left-1', right: 'right-1', label: 'updated'}));
          await waitLabel('updated');
        }
        await click('.left'); await click('.right');
      }
      const expected = ['left-0', 'right-0', 'left-1', 'right-1']
        .flatMap(value => chain ? [value, `after:${value}`] : [value]);
      assert.deepEqual(await getPage().evaluate(() => renderContract.calls), expected);
    });
  }

  it('render contract: keyed reorders retain nodes, fresh captures and bounded handler names', async () => {
    await mount();
    const result = await getPage().evaluate(async () => {
      const host = document.querySelector('render-contract');
      const originals = new Map([...host.shadowRoot.querySelectorAll('.row')].map(node => [node.dataset.id, node]));
      const names = host.names.size;
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
      const issues = [];
      for (let iteration = 0; iteration < 30; iteration++) {
        const ids = iteration % 2 ? ['b', 'c', 'a'] : ['c', 'a', 'b'];
        setState('RenderContract', {...getState('RenderContract'), items: ids.map(id => ({id})), label: `order-${iteration}`});
        await frame(); await frame();
        const rows = [...host.shadowRoot.querySelectorAll('.row')];
        if (rows.map(node => node.dataset.id).join() !== ids.join()) issues.push('order');
        if (rows.some(node => originals.get(node.dataset.id) !== node)) issues.push('identity');
        if (host.names.size !== names) issues.push('handler-name growth');
      }
      return issues;
    });
    assert.deepEqual(result, []);
    for (const id of ['b', 'c', 'a']) await click(`[data-id="${id}"]`);
    assert.deepEqual(await getPage().evaluate(() => renderContract.calls),
      [{id: 'b', index: 0}, {id: 'c', index: 1}, {id: 'a', index: 2}]);
  });

  it('render contract: an older async render cannot overwrite a newer state', async () => {
    await mount();
    await holdOlderRender();
    await getPage().evaluate(() => setState('RenderContract', {...getState('RenderContract'),
      label: 'newer', left: 'new-left'}));
    await waitLabel('newer');
    await settleOlderRender();
    assert.equal(await getPage().evaluate(() => document.querySelector('render-contract')
      .shadowRoot.querySelector('output').textContent), 'newer');
    await click('.left');
    assert.deepEqual(await getPage().evaluate(() => renderContract.calls), ['new-left']);
  });

  it('render contract: disconnect invalidates pending work across reconnect', async () => {
    await mount();
    await holdOlderRender();
    await getPage().evaluate(() => {
      const host = document.querySelector('render-contract');
      host.remove();
      setState('RenderContract', {...getState('RenderContract'), label: 'reconnected', left: 'new-left'});
      document.body.appendChild(host);
    });
    await waitLabel('reconnected');
    await settleOlderRender();
    assert.equal(await getPage().evaluate(() => document.querySelector('render-contract')
      .shadowRoot.querySelector('output').textContent), 'reconnected');
    await click('.left');
    assert.deepEqual(await getPage().evaluate(() => renderContract.calls), ['new-left']);
  });

  it('render contract: app class updates retain component readiness classes', async () => {
    await loadTestPage();
    await getPage().evaluate(async () => {
      setState('ListState', {items: ['a', 'b'].map(id => ({id, title: id})), active: 'a'});
      await use('toggle-list'); await use('toggle-item');
      const host = document.createElement('toggle-list');
      host.setAttribute('state', 'ListState'); document.body.appendChild(host);
    });
    await getPage().waitForFunction(() => {
      const nodes = document.querySelector('toggle-list')?.shadowRoot?.querySelectorAll('toggle-item');
      return nodes?.length === 2 && [...nodes].every(node => node.classList.contains('bang-styled'));
    });
    await getPage().evaluate(() => setState('ListState', {...getState('ListState'), active: 'b'}));
    await getPage().waitForFunction(() => document.querySelector('toggle-list').shadowRoot
      .querySelector('toggle-item.active')?.shadowRoot?.querySelector('button')?.dataset.id === 'b');
    assert.deepEqual(await getPage().evaluate(() => [...document.querySelector('toggle-list').shadowRoot
      .querySelectorAll('toggle-item')].map(node => ({ready: node.classList.contains('bang-styled'),
        component: node.classList.contains('bang-el')}))), [{ready: true, component: true}, {ready: true, component: true}]);
  });

  it('render contract: an optional missing stylesheet does not strand visibility', async () => {
    await getPage().setRequestInterception(true);
    getPage().on('request', request => request.url().endsWith('/render-contract/style.css')
      ? request.respond({status: 404, body: 'Not found'}) : request.continue());
    await mount();
    assert.equal(await getPage().evaluate(() => getComputedStyle(document.querySelector('render-contract')).visibility), 'visible');
  });
}
