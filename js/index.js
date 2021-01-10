import {iniXSSProtection} from './xss-protection.js';
import {COMMANDS, handleHeaderCommand, handlePlainCommand, HEADERS, initEditor} from './wysiwig.js';

const EDITOR = '#editor';
const FRAME = '#frame';
const H1_BUTTON = '#h1';
const H2_BUTTON = '#h2';
const ITALIC_BUTTON = '#italic';
const BOLD_BUTTON = '#bold';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    const frame = document.querySelector(FRAME);
    const h1Button = document.querySelector(H1_BUTTON);
    const h2Button = document.querySelector(H2_BUTTON);
    const italicButton = document.querySelector(ITALIC_BUTTON);
    const boldButton = document.querySelector(BOLD_BUTTON);

    frame.srcdoc = `<html>
        <head>
            <link rel="stylesheet" href="./styles/editor.css"/>
            <link rel="stylesheet" href="./styles/frame.css"/>
        </head>
        <body><div id="editor" class="edit-area" placeholder="Type something..."></div></body>
    </html>`;

    frame.addEventListener('load', () => {
        const frameDocument = frame.contentDocument;
        const editor = frameDocument.querySelector(EDITOR);

        initEditor(editor, frameDocument);
        iniXSSProtection(editor);
    });

    h1Button.addEventListener('click', () => {
        handleHeaderCommand(HEADERS.H1);
    });
    h2Button.addEventListener('click', () => {
        handleHeaderCommand(HEADERS.H2);
    });
    italicButton.addEventListener('click', () => {
        handlePlainCommand(COMMANDS.ITALIC);
    });
    boldButton.addEventListener('click', () => {
        handlePlainCommand(COMMANDS.BOLD);
    });
}