import {isFirefox} from './utils.js';

export const HEADERS = {
    'H1': 7,
    'H2': 6
};

const BOLD_FONT_WEIGHT_VAR = '--bold-font-weight';
const DEFAULT_FONT_WEIGHT_VAR = '--default-font-weight';

let BOLD_FONT_WEIGHT = 0;
let DEFAULT_FONT_WEIGHT = 0;
let EDITOR = null;

const canExecCommand = () => {
    const selection = document.getSelection();

    if (selection.isCollapsed) {
        return false;
    }

    return true;
}

// getting all text nodes inside editor
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

// getting all parents of text node inside EDITOR
const getTextNodeParents = node => {
    const parents = []
    let parent = node.parentElement;

    while (parent !== EDITOR) {
        parents.push(parent);

        parent = parent.parentElement;
    }

    return parents;
}

// getting map of paragraphs and their text nodes
const getParagraphsWithTextNodes = selectedTextNodes => {
    const parentsMap = new Map();

    selectedTextNodes.forEach(node => {
        const parents = getTextNodeParents(node);

        const parent = !!parents.length ? parents[parents.length - 1] : EDITOR;

        if (parentsMap.has(parent)) {
            parentsMap.set(parent, [...parentsMap.get(parent), node]);
        } else {
            parentsMap.set(parent, [node]);
        }
    });

    return parentsMap;
};

const getNodesTree = () => {
    const walk = (root) => {
        const tree = {};

        tree.root = root;
        tree.children = Array.from(root.childNodes).map(node => walk(node));

        return tree;
    }

    const nodesTree = walk(EDITOR);

    return nodesTree;
};

// getting selected part of text in node
const getSelectedNodeText = (node, selection, selectionOrder) => {
    // node in the middle of selection
    if (node !== selection.anchorNode && node !== selection.focusNode) {
        return node.textContent;
    }

    // only node in selection
    if (selection.anchorNode === selection.focusNode) {
        if (selectionOrder === 1) {
            return node.textContent.substring(selection.anchorOffset, selection.focusOffset);
        } else {
            return node.textContent.substring(selection.focusOffset, selection.anchorOffset);
        }
    }

    if (node === selection.anchorNode) {
        if (selectionOrder === 1) {
            return selection.anchorNode.textContent.substr(selection.anchorOffset, selection.anchorNode.textContent.length);
        } else {
            return selection.anchorNode.textContent.substr(0, selection.anchorOffset);
        }
    } else {
        if (selectionOrder === 1) {
            return selection.focusNode.textContent.substr(0, selection.focusOffset);
        } else {
            return selection.focusNode.textContent.substr(selection.focusOffset, selection.focusNode.textContent.length);
        }
    }
}

const getClipboardContent = (nodesTree, selection, selectionOrder) => {
    const walk = children => {
        return children.map(child => {
            const isTextNode = child.root.nodeType === child.root.TEXT_NODE;
            const el = isTextNode ? document.createElement('span') : child.root.cloneNode();

            if (isTextNode) {
                const st = getComputedStyle(isTextNode ? child.root.parentElement : child.root);
                const styles = `` +
                    `font-family: ${st.getPropertyValue('font-family')}; ` +
                    `font-size: ${st.getPropertyValue('font-size')}; ` +
                    `font-weight: ${st.getPropertyValue('font-weight')}; ` +
                    `font-style: ${st.getPropertyValue('font-style')}; ` +
                    `font-variant: ${st.getPropertyValue('font-variant')}; ` +
                    `line-height: ${st.getPropertyValue('line-height')}; ` +
                    `text-decoration: ${st.getPropertyValue('text-decoration')}; ` +
                    `vertical-align: ${st.getPropertyValue('vertical-align')}; ` +
                    `white-space: ${st.getPropertyValue('white-space')}; ` +
                    `color: ${st.getPropertyValue('color')}; ` +
                    `background-color: ${st.getPropertyValue('background-color')};`;

                el.setAttribute('style', styles);
                el.textContent = getSelectedNodeText(child.root, selection, selectionOrder);
            } else {
                walk(child.children).forEach(n => el.append(n));
            }

            return el;
        });
    }

    const contents = walk(nodesTree.children);

    return contents.reduce((accum, el) => accum += el.outerHTML, '');
}

export const initEditor = editor => {
    const styles = getComputedStyle(editor);

    EDITOR = editor;
    DEFAULT_FONT_WEIGHT = parseInt(styles.getPropertyValue(DEFAULT_FONT_WEIGHT_VAR), 10);
    BOLD_FONT_WEIGHT = parseInt(styles.getPropertyValue(BOLD_FONT_WEIGHT_VAR), 10);

    document.execCommand('defaultParagraphSeparator', false, 'p');
}

export const handeCopyCommand = event => {
    if (!canExecCommand()) {
        return;
    }

    event.preventDefault();

    const selection = window.getSelection();
    const allTextNodes = collectAllTextNodes(EDITOR);
    // selection is left->right up->down OR right->left down->up
    const selectionOrder = allTextNodes.indexOf(selection.anchorNode) > allTextNodes.indexOf(selection.focusNode) ? -1 : 1;
    const nodesTree = getNodesTree();
    const content = getClipboardContent(nodesTree, selection, selectionOrder)

    event.clipboardData.clearData();
    event.clipboardData.setData('text/html', content);
}

export const handeCutCommand = event => {
    if (!canExecCommand()) {
        return;
    }

    event.preventDefault();

    const selection = document.getSelection();
    const allTextNodes = collectAllTextNodes(EDITOR);
    const selectedTextNodes = allTextNodes.filter(node => selection.containsNode(node));
    // selection is left->right up->down OR right->left down->up
    const selectionOrder = selectedTextNodes.indexOf(selection.anchorNode) > selectedTextNodes.indexOf(selection.focusNode) ? -1 : 1;
    const selectedTextNodesParents = getParagraphsWithTextNodes(selectedTextNodes);
    const nodesTree = getNodesTree();
    const content = getClipboardContent(nodesTree, selection, selectionOrder)

    // removing cut out nodes
    selectedTextNodesParents.forEach((nodes, parent) => {
        let removed = 0;

        nodes.forEach(node => {
            const selectedText = getSelectedNodeText(node, selection, selectionOrder);

            if (node.textContent === selectedText) {
                node.remove();
                removed++;

                return;
            }

            node.textContent = node.textContent.replace(selectedText, '');
        });

        if (parent !== EDITOR && removed === nodes.length) {
            parent.remove();
        }
    });

    event.clipboardData.clearData();
    event.clipboardData.setData('text/html', content);
}

export const handleItalicCommand = () => {
    if (!canExecCommand()) {
        return;
    }

    document.execCommand('italic');
};

export const handleBoldCommand = () => {
    if (!canExecCommand()) {
        return;
    }

    if (isFirefox() && !!window.patchFirefox) {
        const selection = document.getSelection();
        const allTextNodes = collectAllTextNodes(EDITOR);
        const selectedTextNodes = allTextNodes.filter(node => selection.containsNode(node));
        const isBold = selectedTextNodes.every(node => +getComputedStyle(node.parentElement)['font-weight'] >= BOLD_FONT_WEIGHT);

        if (isBold) {
            selectedTextNodes.forEach(node => {
                const parents = getTextNodeParents(node);
                const boldElement = parents.find(p => p.style.fontWeight >= BOLD_FONT_WEIGHT);

                if (boldElement) {
                    boldElement.style.fontWeight = DEFAULT_FONT_WEIGHT;
                }
            });
        }

        const obs = new MutationObserver(() => {
            // see case #1 in https://github.com/glebmlk/wysiwig-task/issues/1
            editor.querySelectorAll('span[style*="font-weight: normal;"]').forEach(el => {
                const fontWeight = getComputedStyle(el.parentElement)['font-weight'];

                if (+fontWeight > DEFAULT_FONT_WEIGHT) {
                    el.style.fontWeight = BOLD_FONT_WEIGHT
                }
            });

            obs.disconnect();
        });

        obs.observe(editor, {
            childList: true,
            subtree: true
        });
    }

    document.execCommand('bold');
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