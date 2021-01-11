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
        parents.push(parent)

        parent = parent.parentElement;
    }

    return parents;
}

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

export const initEditor = editor => {
    const styles = getComputedStyle(editor);

    EDITOR = editor;
    DEFAULT_FONT_WEIGHT = parseInt(styles.getPropertyValue(DEFAULT_FONT_WEIGHT_VAR), 10);
    BOLD_FONT_WEIGHT = parseInt(styles.getPropertyValue(BOLD_FONT_WEIGHT_VAR), 10);

    document.execCommand('defaultParagraphSeparator', false, 'div');
}

export const handeCopyCommand = event => {
    if (!canExecCommand()) {
        return;
    }

    event.preventDefault();

    const selection = window.getSelection();
    const allTextNodes = collectAllTextNodes(EDITOR);
    const selectedTextNodes = allTextNodes.filter(node => selection.containsNode(node));
    // selection is left->right up->down OR right->left down->up
    const selectionOrder = selectedTextNodes.indexOf(selection.anchorNode) > selectedTextNodes.indexOf(selection.focusNode) ? -1 : 1;
    // getting text styles for every text node in selection
    const selectedNodesWithStyles = selectedTextNodes.map(node => {
        const parents = getTextNodeParents(node);

        // closest to text node
        let textStyleNode = parents[0];
        // furthest from text node
        let displayStyleNode = parents[parents.length - 1];

        if (!parents.length) {
            textStyleNode = EDITOR;
        }

        const textStyles = getComputedStyle(textStyleNode);
        const displayStyles = displayStyleNode ? getComputedStyle(displayStyleNode) : undefined;
        const styles = `` +
            `font-size: ${textStyles.getPropertyValue('font-size')}; ` +
            `font-family: ${textStyles.getPropertyValue('font-family').replace(/\"/g, `'`)}; ` +
            `font-weight: ${textStyles.getPropertyValue('font-weight')}; ` +
            `font-style: ${textStyles.getPropertyValue('font-style')}; ` +
            `font-variant: ${textStyles.getPropertyValue('font-variant')}; ` +
            `line-height: ${textStyles.getPropertyValue('line-height')}; ` +
            `text-decoration: ${textStyles.getPropertyValue('text-decoration')}; ` +
            `vertical-align: ${textStyles.getPropertyValue('vertical-align')}; ` +
            `white-space: ${textStyles.getPropertyValue('white-space')}; ` +
            `color: ${textStyles.getPropertyValue('color')}; ` +
            `background-color: ${textStyles.getPropertyValue('background-color')}; ` +
            `margin: ${textStyles.getPropertyValue('margin')}; ` +
            `display: ${displayStyles ? displayStyles.getPropertyValue('display') : 'inline'};`;

        return {
            node,
            styles,
        };
    });
    // wrapping every text node in span with corresponding styles
    const content = selectedNodesWithStyles.reduce((accum, {node, styles}) => {
        const span = document.createElement('span')

        span.textContent = getSelectedNodeText(node, selection, selectionOrder);
        span.setAttribute('style', styles);

        return accum += span.outerHTML;
    }, '');

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