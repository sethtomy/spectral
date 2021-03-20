import { parseBase } from './parseBase.mjs';

function deserializeSrn(srn) {
    const [shortcode, orgSlug, projectSlug, ...uriParts] = srn.split('/');
    const uri = uriParts.length ? `/${uriParts.join('/')}` : undefined;
    let file;
    let ext;
    if (uri) {
        file = uriParts.find(part => part.includes('.'));
        if (file) {
            ext = parseBase(file).ext;
        }
    }
    return {
        shortcode,
        orgSlug,
        projectSlug,
        uri,
        file,
        ext,
    };
}
function serializeSrn({ shortcode, orgSlug, projectSlug, uri = '' }) {
    return [shortcode, orgSlug, projectSlug, uri.replace(/^\//, '')].filter(Boolean).join('/');
}

export { deserializeSrn, serializeSrn };
