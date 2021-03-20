const replace = (str, find, repl) => {
    const orig = str.toString();
    let res = '';
    let rem = orig;
    let beg = 0;
    let end = rem.indexOf(find);
    while (end > -1) {
        res += orig.substring(beg, beg + end) + repl;
        rem = rem.substring(end + find.length, rem.length);
        beg += end + find.length;
        end = rem.indexOf(find);
    }
    if (rem.length > 0) {
        res += orig.substring(orig.length - rem.length, orig.length);
    }
    return res;
};
const encodeFragmentSegment = (segment) => {
    return replace(replace(segment, '~', '~0'), '/', '~1');
};
const addToJSONPointer = (pointer, part) => {
    return `${pointer}/${encodeFragmentSegment(part)}`;
};
const uriToJSONPointer = (uri) => {
    if ('length' in uri && uri.length === 0) {
        return '';
    }
    return uri.fragment() !== '' ? `#${uri.fragment()}` : uri.href() === '' ? '#' : '';
};
const uriIsJSONPointer = (ref) => {
    return (!('length' in ref) || ref.length > 0) && ref.path() === '';
};

export { addToJSONPointer, uriIsJSONPointer, uriToJSONPointer };
