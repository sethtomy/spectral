const renameObjectKey = (obj, oldKey, newKey) => {
    if (!obj || !Object.hasOwnProperty.call(obj, oldKey) || oldKey === newKey) {
        return obj;
    }
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === oldKey) {
            newObj[newKey] = value;
        }
        else if (!(key in newObj)) {
            newObj[key] = value;
        }
    }
    return newObj;
};

export { renameObjectKey };
