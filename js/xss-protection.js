export const iniXSSProtection = editor => {
    // listening to changes of innerHTML prop
    const obs = new MutationObserver(() => {
        obs.disconnect()

        Array.from(editor.children).forEach(child => {
            // removing unsupported and potentially unsafe elements such as img, script...
            if (!['b', 'i', 'font'].includes(child.nodeName.toLowerCase())) {
                child.remove();
            } else {
                Array.from(child.attributes).forEach(attr => {
                    // removing unsupported and potentially unsafe attributes such as onerror, onload...
                    // style is also potentially unsafe: background urls need to be inspected too...
                    if (!['style', 'size'].includes(attr.name.toLowerCase())) {
                        child.removeAttributeNode(attr);
                    }
                });
            }
        });

        obs.observe(editor, {
            childList: true,
            subtree: true
        });
    });

    obs.observe(editor, {
        childList: true,
        subtree: true
    });
}