// 'just-diff' - by angus croll, licensed under the MIT license
// https://github.com/angus-c/just/tree/d8c5dd18941062d8db7e9310ecc8f53fd607df54/packages/collection-diff

function diff(obj1, obj2, pathConverter) {
    if (!obj1 || typeof obj1 != 'object' || !obj2 || typeof obj2 != 'object') {
        throw new Error('both arguments must be objects or arrays');
    }

    pathConverter ||
    (pathConverter = function(arr) {
        return arr;
    });

    function getDiff({obj1, obj2, basePath, basePathForRemoves, diffs}) {
        var obj1Keys = Object.keys(obj1);
        var obj1KeysLength = obj1Keys.length;
        var obj2Keys = Object.keys(obj2);
        var obj2KeysLength = obj2Keys.length;
        var path;

        var lengthDelta = obj1.length - obj2.length;

        if (trimFromRight(obj1, obj2)) {
            for (var i = 0; i < obj1KeysLength; i++) {
                var key = Array.isArray(obj1) ? Number(obj1Keys[i]) : obj1Keys[i];
                if (!(key in obj2)) {
                    path = basePathForRemoves.concat(key);
                    diffs.remove.push({
                        op: 'remove',
                        path: pathConverter(path),
                    });
                }
            }

            for (var i = 0; i < obj2KeysLength; i++) {
                var key = Array.isArray(obj2) ? Number(obj2Keys[i]) : obj2Keys[i];
                pushReplaces({
                    key,
                    obj1,
                    obj2,
                    path: basePath.concat(key),
                    pathForRemoves: basePath.concat(key),
                    diffs,
                });
            }
        } else {
            // trim from left, objects are both arrays
            for (var i = 0; i < lengthDelta; i++) {
                path = basePathForRemoves.concat(i);
                diffs.remove.push({
                    op: 'remove',
                    path: pathConverter(path),
                });
            }

            // now make a copy of obj1 with excess elements left trimmed and see if there any replaces
            var obj1Trimmed = obj1.slice(lengthDelta);;
            for (var i = 0; i < obj2KeysLength; i++) {
                pushReplaces({
                    key: i,
                    obj1: obj1Trimmed,
                    obj2,
                    path: basePath.concat(i),
                    // since list of removes are reversed before presenting result,
                    // we need to ignore existing parent removes when doing nested removes
                    pathForRemoves: basePath.concat(i + lengthDelta),
                    diffs,
                });
            }
        }
    }

    var diffs = {remove: [], replace: [], add: []};
    getDiff({
        obj1,
        obj2,
        basePath: [],
        basePathForRemoves: [],
        diffs,
    });

    // reverse removes since we want to maintain indexes
    return diffs.remove
        .reverse()
        .concat(diffs.replace)
        .concat(diffs.add);

    function pushReplaces({key, obj1, obj2, path, pathForRemoves, diffs}) {
        var obj1AtKey = obj1[key];
        var obj2AtKey = obj2[key];

        if(!(key in obj1) && (key in obj2)) {
            var obj2Value = obj2AtKey;
            diffs.add.push({
                op: 'add',
                path: pathConverter(path),
                value: obj2Value,
            });
        } else if(obj1AtKey !== obj2AtKey) {
            if(Object(obj1AtKey) !== obj1AtKey ||
                Object(obj2AtKey) !== obj2AtKey || differentTypes(obj1AtKey, obj2AtKey)
            ) {
                pushReplace(path, diffs, obj2AtKey);
            } else {
                if(!Object.keys(obj1AtKey).length &&
                    !Object.keys(obj2AtKey).length &&
                    String(obj1AtKey) != String(obj2AtKey)) {
                    pushReplace(path, diffs, obj2AtKey);
                } else {
                    getDiff({
                        obj1: obj1[key],
                        obj2: obj2[key],
                        basePath: path,
                        basePathForRemoves: pathForRemoves,
                        diffs});
                }
            }
        }
    }

    function pushReplace(path, diffs, newValue) {
        diffs.replace.push({
            op: 'replace',
            path: pathConverter(path),
            value: newValue,
        });
    }
}

function jsonPatchPathConverter(arrayPath) {
    return [''].concat(arrayPath).join('/');
}

function differentTypes(a, b) {
    return Object.prototype.toString.call(a) != Object.prototype.toString.call(b);
}

function trimFromRight(obj1, obj2) {
    var lengthDelta = obj1.length - obj2.length;
    if (Array.isArray(obj1) && Array.isArray(obj2) && lengthDelta > 0) {
        var leftMatches = 0;
        var rightMatches = 0;
        for (var i = 0; i < obj2.length; i++) {
            if (String(obj1[i]) === String(obj2[i])) {
                leftMatches++;
            } else {
                break;
            }
        }
        for (var j = obj2.length; j > 0; j--) {
            if (String(obj1[j + lengthDelta]) === String(obj2[j])) {
                rightMatches++;
            } else {
                break;
            }
        }

        // bias to trim right becase it requires less index shifting
        return leftMatches >= rightMatches;
    }
    return true;
}
