
"use strict";

module.exports = { unassign };

function unassign(obj, ...names) {
    names.forEach(name => delete obj[name]);
    return obj;
}