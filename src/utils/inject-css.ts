const cssCache = new Set<string>();

export function injectCSS(id: string, css: string): void {
    if (typeof document === 'undefined' || cssCache.has(id)) {
        return;
    }
    cssCache.add(id);
    const style = document.createElement('style');
    style.setAttribute('data-injected', id);
    style.textContent = css;
    document.head.appendChild(style);
}
