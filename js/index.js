import {handleBoldAction, handleHeaderAction, handleItalicAction, HEADERS, initEditor} from './wysiwig.js';

const EDITOR = '#editor';
const H1_BUTTON = '#h1';
const H2_BUTTON = '#h2';
const ITALIC_BUTTON = '#italic';
const BOLD_BUTTON = '#bold';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    const editor = document.querySelector(EDITOR);
    const h1Button = document.querySelector(H1_BUTTON);
    const h2Button = document.querySelector(H2_BUTTON);
    const italicButton = document.querySelector(ITALIC_BUTTON);
    const boldButton = document.querySelector(BOLD_BUTTON);

    initEditor(editor);

    h1Button.addEventListener('click', () => {
        handleHeaderAction(HEADERS.H1);
    });
    h2Button.addEventListener('click', () => {
        handleHeaderAction(HEADERS.H2);
    });
    italicButton.addEventListener('click', () => {
        handleItalicAction();
    });
    boldButton.addEventListener('click', () => {
        handleBoldAction();
    });
}