
export const HEADERS = {
    'H1': 7,
    'H2': 6
};

const BOLD_FONT_WEIGHT_VAR = '--bold-font-weight';
const DEFAULT_FONT_WEIGHT_VAR = '--default-font-weight';

let DEFAULT_FONT_WEIGHT = null;
let BOLD_FONT_WEIGHT = null;
let EDITOR = null;

const canExecCommand = () => {
    const selection = document.getSelection();

    if (selection.isCollapsed) {
        return false;
    }

    return true;
}

export const initEditor = editor => {
    const styles = getComputedStyle(editor);

    DEFAULT_FONT_WEIGHT = parseInt(styles.getPropertyValue(DEFAULT_FONT_WEIGHT_VAR), 10);
    BOLD_FONT_WEIGHT = parseInt(styles.getPropertyValue(BOLD_FONT_WEIGHT_VAR), 10);
    EDITOR = editor;
}

export const handleBoldAction = () => {
    if (!canExecCommand()) {
        return;
    }

    document.execCommand('bold');
};

export const handleItalicAction = () => {
    if (!canExecCommand()) {
        return;
    }

    document.execCommand('italic');
};

export const handleHeaderAction = size => {
    if (!canExecCommand()) {
        return;
    }

    document.execCommand('fontSize', false, size);
};