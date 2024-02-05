const ticker = new Ticker();
window.ticker = ticker;

const frameCounter = document.getElementById('frame-counter');
const timeCounter = document.getElementById('time-counter');
const layoutDisplay = document.getElementById('layout-display');
const playerXDisplay = document.getElementById('player-x-display');
const playerYDisplay = document.getElementById('player-y-display');
const heldKeyMap = { };
const keyDisplays = {
    [37]: document.getElementById('input-display-left'),
    [39]: document.getElementById('input-display-right')
};

let saveStateDiffs = [];

const recordingCheckbox = document.getElementById('recording-checkbox');
const playingCheckbox = document.getElementById('playing-checkbox');
const rewindButton = document.getElementById('rewind-button');
const rewindCheckbox = document.getElementById('rewind-checkbox');
const trimMovieCheckbox = document.getElementById('trim-movie-checkbox');
const canvas = document.getElementById('c2canvas');

let previousFrameState = { };
let paused = true;

let currentLayout = 'LOAD';

rewindCheckbox.addEventListener('change', event => {
    rewindButton.disabled = !event.target.checked;
});

document.getElementById('save-state-button').addEventListener('click', () => {
    const runtime = canvas['c2runtime'];
    savedState = runtime.saveToJSONString();
});

document.getElementById('load-state-button').addEventListener('click', () => {
    if (savedState == null) {
        return;
    }

    const runtime = canvas['c2runtime'];
    runtime.loadFromJSONString(savedState);
});

function pause(reset) {
    paused = true;
    ticker.sleep(reset);
}

function unpause() {
    paused = false;
    ticker.wake();
}

document.getElementById('reset-game-button').addEventListener('click', () => {
    onReset();
});

document.getElementById('pause-button').addEventListener('click', () => {
    pause();
});

document.getElementById('play-button').addEventListener('click', () => {
    unpause();
});

document.getElementById('tick-button').addEventListener('click', () => {
    ticker.tick(true);
});

document.getElementById('export-inputs-button').addEventListener('click', () => {
    const a = document.createElement('a');
    const normalizedMovie = Object.entries(movie).reduce((result, [key, value]) => {
        result[key] = Array.from(value, item => typeof item === 'undefined' ? [] : item);
        return result;
    }, {});
    const file = new Blob([
        JSON.stringify(normalizedMovie)
            .replaceAll(']],', ']],\n')
            .replaceAll('[],', '[],\n')
            .replaceAll('null,', 'null,\n')
            .replaceAll('":[[', '":[\n[')
    ], { type: 'text/plain' });
    a.href = URL.createObjectURL(file);
    a.download = 'inputs.json';
    a.click();
});

document.getElementById('clear-inputs-button').addEventListener('click', () => {
    movie = { };
});

rewindButton.addEventListener('click', () => {
    onRewind();
});

document.getElementById('add-blank-frames-button').addEventListener('click', () => {
    movie[currentLayout] = movie[currentLayout].concat(Array.from({ length: 60 }, () => []));
    setVisibleFrame(ticker.frame);
});

document.addEventListener('keyup', e => {
    if ((e.which !== 39 && e.which !== 37) || paused || !recordingCheckbox.checked) return;
    if (movie[currentLayout] == null) {
        movie[currentLayout] = [];
    }
    movie[currentLayout][ticker.frame].push([0, e.which]);
    heldKeyMap[e.which] = false;
});

function onReset() {
    setLayout('START');

    Object.values(keyDisplays).forEach(el => {
        el.style.opacity = '0';
    });
    dispatchKeyEvent(37, 'keyup');
    dispatchKeyEvent(39, 'keyup');
    saveStateDiffs = [];
}

function onRewind() {
    if (!saveStateDiffs.length) return;

    const layoutBeforeRewind = currentLayout;
    const diff = saveStateDiffs.pop();
    const runtime = canvas['c2runtime'];
    const rewindedState = clone(previousFrameState);
    diffApply(rewindedState, diff.diff);
    runtime.loadFromObject(rewindedState);
    previousFrameState = rewindedState;
    if (playingCheckbox.checked) {
        // if we figure out we're rewinding into the previous scene, flip back the controls using the first inputs of the last layout
        dispatchEventsForFrame(true, ticker.frame, diff.isSceneSwitch ? layoutBeforeRewind : currentLayout);
    }
    ticker.frame = diff.frame;
    ticker.fakeTime -= ticker.fakeTimeDelta;
    updateCounters(ticker.fakeTime, ticker.frame);
    runtime.tickFunc(ticker.fakeTime);
}

document.addEventListener('keydown', e => {
    switch (e.which) {
        case 80: // P
            e.preventDefault();
            if (paused) {
                unpause();
            } else {
                pause();
            }
            return;
        case 59: // ;
            e.preventDefault();
            onRewind();
            scrollToCurrentFrame();
            return;
        case 84: // T
            e.preventDefault();
            ticker.tick(true);
            scrollToCurrentFrame();
            return;
        case 221: // ]
            e.preventDefault();
            onReset();
            return;
        case 191: // -
            e.preventDefault();
            rewindCheckbox.checked = !rewindCheckbox.checked;
            return;
        case 190: // .
            e.preventDefault();
            playingCheckbox.checked = !playingCheckbox.checked;
            return;
        case 188: // ,
            e.preventDefault();
            recordingCheckbox.checked = !recordingCheckbox.checked;
            return;
        case 75: // K
            e.preventDefault();
            setVisibleFrame(ticker.frame);
            return;
        case 78:
            e.preventDefault();
            setLayout(currentLayout);
            return;
    }
    // 37 === left
    // 39 === right
    if (e.repeat || (e.which !== 39 && e.which !== 37) || paused || !recordingCheckbox.checked) return;
    if (movie[currentLayout] == null) {
        movie[currentLayout] = [];
    }
    heldKeyMap[e.which] = true;
    movie[currentLayout][ticker.frame].push([1, e.which]);
});

hookAfter(cr.runtime.prototype, 'initRendererAndLoader', function () {
    const runtime = canvas['c2runtime'];
    ticker.add(function (time, delta, frame) {
        updateCounters(time, frame);

        if (recordingCheckbox.checked) {
            movie[currentLayout][frame] = [];
        } else if (playingCheckbox.checked) {
            dispatchEventsForFrame(false);
        }
        runtime.tickFunc(time);

        if (rewindCheckbox.checked) {
            const state = runtime.saveToObject();
            const isSceneSwitch = frame - 1 === 0;
            saveStateDiffs.push({
                diff: diff(state, previousFrameState),
                frame: isSceneSwitch ? (saveStateDiffs[saveStateDiffs.length - 1]?.frame ?? 0) + 1 : frame - 1,
                isSceneSwitch
            });
            previousFrameState = state;
        }
    });
    pause(true);
});

hookAfter(cr.runtime.prototype, 'tick', function () {
    const playerType = this.types['t31'].instances[0];
    playerXDisplay.innerText = playerType?.x ?? '?';
    playerYDisplay.innerText = playerType?.y ?? '?';
});

hookAfter(cr.layout.prototype, 'startRunning', function () {
    if (trimMovieCheckbox.checked && ticker.frame > 1) {
        console.log('trimming movie for layout', currentLayout, 'to', ticker.frame, 'frames');
        movie[currentLayout].splice(ticker.frame + 1);
    }
    currentLayout = this.name;
    layoutDisplay.innerText = currentLayout;
    ticker.frame = 0;
    if (movie[currentLayout] == null) {
        movie[currentLayout] = [];
        if (recordingCheckbox.checked) {
            movie[currentLayout].push([[heldKeyMap[37] ? 1 : 0, 37], [heldKeyMap[39] ? 1 : 0, 39]]);
        }
    } else if (playingCheckbox.checked && movie[currentLayout][0]?.length != null) {
        dispatchEventsForFrame(false, 0);
    }
    setVisibleFrame(1);
});

function dispatchEventsForFrame(reverse, frame = ticker.frame, layout = currentLayout) {
    const input = movie[layout][frame];
    if (input) {
        for (let i = 0; i < input.length; i++) {
            const key = input[i];
            if (key[0] !== 0 && key[0] !== 1) continue;
            dispatchKeyEvent(key[1], key[0] === (reverse ? 0 : 1) ? 'keydown' : 'keyup');
            keyDisplays[key[1]].style.opacity = reverse ? 1 >> key[0] : key[0];
            heldKeyMap[key[1]] = key[0] === (reverse ? 0 : 1);
        }
    } else {
        pause();
    }
}

function updateCounters(time, frame) {
    timeCounter.innerText = time;
    frameCounter.innerText = frame;
    setCurrentEditorFrame(frame);
}

function dispatchKeyEvent(which, type) {
    const event = new Event(type);
    event.which = which;
    document.dispatchEvent(event);
}

function hookAfter(obj, targetFunction, hookFunction) {
    let temp = obj[targetFunction]
    obj[targetFunction] = function (...args) {
        let ret = temp.apply(this, args)
        if (ret && typeof ret.then === 'function') {
            return ret.then((value)=>{hookFunction.apply(this, [value, args]); return value;})
        } else {
            hookFunction.apply(this, [ret, args])
            return ret
        }
    }
}
