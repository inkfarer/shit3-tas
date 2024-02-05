let editorVisible = false;

const editor = document.getElementById('editor');
const editorBody = document.getElementById('editor-body');
const editorTableForm = document.getElementById('editor-table-form');
const frameInput = document.getElementById('editor-frame-input');
const moveToCurrentButton = document.getElementById('move-editor-to-current-frame-button');
const moveToInputButton = document.getElementById('move-editor-to-input-frame-button');

const editorSize = 120;
let visibleFrame = 0;
let frameTo = editorSize;

document.getElementById('toggle-editor-button').addEventListener('click', () => {
    editorVisible = !editorVisible;
    editor.style.display = editorVisible ? 'block' : 'none';
});

moveToCurrentButton.addEventListener('click', () => {
    setVisibleFrame(ticker.frame);
});

moveToInputButton.addEventListener('click', () => {
    setVisibleFrame(Number(frameInput.value));
});

editorBody.addEventListener('change', event => {
    const frame = Number(event.target.dataset.frame);
    const lState = editorTableForm[`key-l-${frame}`].value;
    const rState = editorTableForm[`key-r-${frame}`].value;
    const events = [];
    if (lState !== 'none') {
        events.push([lState === 'up' ? 0 : 1, 37]);
    }
    if (rState !== 'none') {
        events.push([rState === 'up' ? 0 : 1, 39]);
    }
    movie[currentLayout][frame] = events;
    setPressedCells();
});

editorBody.addEventListener('click', event => {
    if (event.target.classList.contains('delete-button')) {
        event.preventDefault();
        const frame = Number(event.target.dataset.frame);
        movie[currentLayout].splice(frame, 1);
        setVisibleFrame(visibleFrame);
    }
});

function setPressedCells() {
    let lPressed = false;
    let rPressed = false;

    for (let i = 0; i <= frameTo; i++) {
        const events = movie[currentLayout]?.[i];
        if (events == null) continue;
        const lEvent = events.find(ev => ev[1] === 37);
        if (lEvent != null) {
            if (lPressed && lEvent[0] === 0) {
                lPressed = false;
            } else if (!lPressed && lEvent[0] === 1) {
                lPressed = true;
            }
        }
        const rEvent = events.find(ev => ev[1] === 39);
        if (rEvent != null) {
            if (rPressed && rEvent[0] === 0) {
                rPressed = false;
            } else if (!rPressed && rEvent[0] === 1) {
                rPressed = true;
            }
        }

        setPressedCellState('l', i, lPressed, lEvent);
        setPressedCellState('r', i, rPressed, rEvent);
    }
}

function setPressedCellState(key, frame, pressed, event) {
    if (frame !== 0) {
        setEditorKeyRadioDisabled(key, 'down', frame, (event != null && event[0] === 0) || pressed);
        setEditorKeyRadioDisabled(key, 'up', frame, (event != null && event[0] === 0) || !pressed);
    }
    const pressedCell = document.getElementById(`pressed-cell-${key}-${frame}`);
    if (pressedCell) {
        pressedCell.style.backgroundColor = pressed ? key === 'l' ? 'red' : 'blue' : 'transparent';
        if (event != null) {
            pressedCell.innerText = event[0] === 1 ? '▼' : '▲';
        } else {
            pressedCell.innerText = '';
        }
    }
}

function setEditorKeyRadioDisabled(key, keyEvent, frame, disabled) {
    const input = document.getElementById(`key${keyEvent}-${key}-${frame}`);
    if (!input) return;
    input.disabled = disabled;
}

function setCurrentEditorFrame(frame) {
    const previousCurrentFrameElem = editor.querySelector('.current-frame');
    if (previousCurrentFrameElem) {
        previousCurrentFrameElem.style.backgroundColor = 'transparent';
        previousCurrentFrameElem.classList.remove('current-frame');
    }

    const currentFrameElem = editor.querySelector(`tr[data-frame="${frame}"]`);
    if (currentFrameElem != null) {
        currentFrameElem.style.backgroundColor = 'green';
        currentFrameElem.classList.add('current-frame');
    }
}

function scrollToCurrentFrame() {
    const currentFrameElem = editor.querySelector('.current-frame');
    if (currentFrameElem) {
        currentFrameElem.scrollIntoView({ block: 'center' });
    }
}

function setVisibleFrame(frame) {
    visibleFrame = frame;
    frameInput.value = visibleFrame;
    const frameFrom = Math.max(0, frame - Math.floor(editorSize / 2));
    frameTo = frameFrom + editorSize;
    let currentFrameRow;

    editorBody.innerHTML = '';
    for (let i = frameFrom; i <= frameTo; i++) {
        const row = document.createElement('tr');
        row.dataset.frame = i;
        if (i === frame) {
            row.style.backgroundColor = 'green';
            row.classList.add('current-frame');
            currentFrameRow = row;
        }
        const numberCol = document.createElement('td');
        numberCol.innerText = i;
        row.appendChild(numberCol);
        const radioCol = document.createElement('td');
        radioCol.append(
            createEditorKeyLabel('L'),
            ...createEditorKeyRadio('l', 'none', i),
            ...createEditorKeyRadio('l', 'up', i),
            ...createEditorKeyRadio('l', 'down', i),
            document.createElement('br'),
            createEditorKeyLabel('R'),
            ...createEditorKeyRadio('r', 'none', i),
            ...createEditorKeyRadio('r', 'up', i),
            ...createEditorKeyRadio('r', 'down', i)
        )
        row.appendChild(radioCol);
        const deleteButtonCol = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.dataset.frame = i;
        deleteButton.innerText = 'DEL';
        deleteButton.classList.add('delete-button');
        deleteButtonCol.appendChild(deleteButton);
        row.appendChild(deleteButtonCol);
        row.append(
            createPressedStateCell('l', i),
            createPressedStateCell('r', i)
        );
        editorBody.appendChild(row);
    }

    currentFrameRow.scrollIntoView({ block: 'center' });
    setPressedCells();
}

function createPressedStateCell(key, frame) {
    const result = document.createElement('td');
    result.id = `pressed-cell-${key}-${frame}`;
    result.classList.add('pressed-cell');
    return result;
}

function createEditorKeyLabel(key) {
    const result = document.createElement('span');
    result.innerText = key;
    result.style.backgroundColor = key === 'L' ? 'red' : 'blue';
    return result;
}

function createEditorKeyRadio(key, event, frame) {
    const id = `key${event}-${key}-${frame}`;

    const input = document.createElement('input');
    input.type = 'radio';
    input.id = id;
    input.name = `key-${key}-${frame}`;
    input.value = event;
    input.dataset.frame = frame;

    const movieFrame = movie[currentLayout]?.[frame];
    const keyCode = key === 'l' ? 37 : 39;
    const eventForKey = movieFrame == null ? null : movieFrame.find(frameEvent => frameEvent[1] === keyCode);
    if (movieFrame != null) {
        switch (event) {
            case 'none':
                input.checked = eventForKey == null;
                break;
            case 'up':
                input.checked = eventForKey != null && eventForKey[0] === 0;
                break;
            case 'down':
                input.checked = eventForKey != null && eventForKey[0] === 1;
                break;
        }
    }

    const label = document.createElement('label');
    label.htmlFor = id;
    label.innerText = event;

    return [input, label];
}

setVisibleFrame(0);
