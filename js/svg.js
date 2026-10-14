const SVG_NS = "http://www.w3.org/2000/svg";

export function createSvgElement(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
}
