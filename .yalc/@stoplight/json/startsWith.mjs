const startsWith = (source, val) => {
    if (source instanceof Array) {
        if (val instanceof Array) {
            if (val.length > source.length)
                return false;
            for (const i in val) {
                if (!val.hasOwnProperty(i))
                    continue;
                const si = parseInt(source[i]);
                const vi = parseInt(val[i]);
                if (!isNaN(si) || !isNaN(vi)) {
                    if (si !== vi) {
                        return false;
                    }
                }
                else if (source[i] !== val[i]) {
                    return false;
                }
            }
        }
    }
    else if (typeof source === 'string') {
        if (typeof val === 'string') {
            return source.startsWith(val);
        }
    }
    else {
        return false;
    }
    return true;
};

export { startsWith };