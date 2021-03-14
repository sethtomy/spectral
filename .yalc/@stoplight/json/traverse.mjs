const traverse = (obj, func, path = []) => {
    if (!obj || typeof obj !== 'object')
        return;
    for (const i in obj) {
        if (!obj.hasOwnProperty(i))
            continue;
        func({ parent: obj, parentPath: path, property: i, propertyValue: obj[i] });
        if (obj[i] && typeof obj[i] === 'object') {
            traverse(obj[i], func, path.concat(i));
        }
    }
};

export { traverse };
