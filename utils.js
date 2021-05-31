
"use strict";

module.exports = { unassign };

function unassign(obj, ...names) {
    const  copy = {...obj};
    names.forEach(name => delete copy[name]);
    return copy;
}