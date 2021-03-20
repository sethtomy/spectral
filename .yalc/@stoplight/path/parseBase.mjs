function parseBase(base) {
    let split = base.lastIndexOf('.');
    if (base === '..')
        split = -1;
    if (base === '.')
        split = -1;
    let name = base;
    let ext = '';
    if (split > 0) {
        name = base.slice(0, split);
        ext = base.slice(split);
    }
    return { name, ext };
}

export { parseBase };
