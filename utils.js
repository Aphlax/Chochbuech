
"use strict";

module.export = { unassign };

function unassign(obj, ...names) {
    const  copy = {...obj};
    names.forEach(name => delete copy[name]);
    return copy;
}