export const HEADERS = {
    'H1': 7,
    'H2': 6
};
export const COMMANDS = {
    BOLD: 'bold',
    ITALIC: 'italic',
    HEADER: 'fontSize'
}

const canExecCommand = () => {
    const selection = document.getSelection();
    const range = selection.getRangeAt(0);

    if (selection.isCollapsed || range.startOffset === range.endOffset) {
        return false;
    }

    return true;
}

export const initEditor = editor => {
    document.execCommand('defaultParagraphSeparator', false, 'p');
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