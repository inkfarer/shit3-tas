const layoutSelector = document.getElementById('layout-selector');
const layoutSelectorButtonListElem = layoutSelector.querySelector('.overlay-scroll-wrapper');
let layoutSelectVisible = false;

document.getElementById('toggle-layout-select-button').addEventListener('click', () => {
    layoutSelectVisible = !layoutSelectVisible;
    layoutSelector.style.display = layoutSelectVisible ? 'block' : 'none';
});

layoutSelectorButtonListElem.addEventListener('click', event => {
    const layout = event.target.dataset.layout;
    if (layout == null) return;
    setLayout(layout);
});

document.getElementById('restart-layout-button').addEventListener('click', () => {
    setLayout(currentLayout);
});

function setLayout(layout) {
    const runtime = canvas['c2runtime'];
    runtime.doChangeLayout(runtime.layouts[layout]);

    runtime.tickFunc(ticker.fakeTime);
}

hookAfter(cr.runtime.prototype, 'initRendererAndLoader', function () {
    Object.keys(canvas['c2runtime'].layouts).forEach(layout => {
        const btn = document.createElement('button');
        btn.innerText = layout;
        btn.dataset.layout = layout;
        layoutSelectorButtonListElem.appendChild(btn);
    });
});
