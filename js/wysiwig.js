export const HEADERS = {
    'H1': 7,
    'H2': 6
};
export const COMMANDS = {
    BOLD: 'bold',
    ITALIC: 'italic'
}

let EDITOR = null;

const canExecCommand = () => {
    const selection = document.getSelection();

    if (selection.isCollapsed) {
        return false;
    }

    return true;
}

const collectAllTextNodes = startNode => {
    if (!startNode) {
        return;
    }

    let textNodes = [];
    let node = startNode.firstChild;

    while (node) {
        if (node.nodeType === node.TEXT_NODE) {
            textNodes.push(node);
        } else {
            textNodes = textNodes.concat(collectAllTextNodes(node));
        }

        node = node.nextSibling;
    }

    return textNodes;
}

export const initEditor = editor => {
    EDITOR = editor;

    document.execCommand('defaultParagraphSeparator', false, 'p');
}

export const handlePlainCommand = command => {
    if (!canExecCommand()) {
        return;
    }

    document.execCommand(command);
};

export const handleItalicAction = () => {
    if (!canExecCommand()) {
        return;
    }

    document.execCommand('italic');
};

export const handleHeaderCommand = size => {
    if (!canExecCommand()) {
        return;
    }

    // see case #3 in https://github.com/glebmlk/wysiwig-task/issues/1
    const selection = document.getSelection();
    const allTextNodes = collectAllTextNodes(EDITOR);
    const selectedTextNodes = allTextNodes.filter(node => selection.containsNode(node));
    // searching nodes with font size = size to apply
    const sameSizeNodes = selectedTextNodes.map(node => {
        let parent = node.parentElement;

        while (parent !== EDITOR) {
            if (parent.nodeName === 'FONT') {
                if (size === +parent.attributes.getNamedItem('size').value) {
                    return node;
                }
            }

            parent = parent.parentElement;
        }
    });

    // applying size only to nodes with no size or different size
    const nodesToApply = selectedTextNodes.filter(node => !sameSizeNodes.includes(node));

    if (!!nodesToApply.length) {
        if (selection.anchorNode === selection.focusNode) {
            document.execCommand('fontSize', false, size);

            return;
        }

        // selection is up-down or down-up
        const selectionOrder = selectedTextNodes.indexOf(selection.anchorNode) > selectedTextNodes.indexOf(selection.focusNode) ? -1 : 1;
        const range = document.createRange();

        if (selectionOrder === 1) {
            range.setStart(nodesToApply[0], selection.anchorOffset);
            range.setEnd(nodesToApply[nodesToApply.length - 1], selection.focusOffset);
        } else {
            range.setStart(nodesToApply[0], selection.focusOffset);
            range.setEnd(nodesToApply[nodesToApply.length - 1], selection.anchorOffset);
        }

        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand('fontSize', false, size);
    }
};