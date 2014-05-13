var W = document.body.offsetWidth - 20,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

canvas.style.width = canvas.style.height = W + 'px';

var retina = devicePixelRatio > 1;

canvas.width = canvas.height = retina ? W * 2 : W;
if (retina) {
    ctx.scale(2, 2);
}

var colors = ['#f40', '#37f', '#0b0'],
    rects;

function drawTree(node, level, height) {
    if (!node) { return; }

    var rect = [];

    if (node.leaf || !node.children) {
        rect.push(level ? colors[(height - level + 2) % colors.length] : 'grey');
        // rect.push(level ? 1 / level : 1);
        rect.push(node.leaf ? 1 : 0.3);
        rect.push(node.children ? node.bbox : node);

        rects.push(rect);
    }

    // if (node.leaf) return;
    // if (level === 6) { return; }
    if (!node.children) return;

    for (var i = 0; i < node.children.length; i++) {
        drawTree(node.children[i], level + 1, height);
    }
}

function transformCoords(coords, max) {
    return [
        Math.round(W * (coords[0] - max[0]) / (max[2] - max[0])),
        Math.round(W * (coords[1] - max[1]) / (max[3] - max[1])),
        Math.round(W * (coords[2] - coords[0]) / (max[2] - max[0])),
        Math.round(W * (coords[3] - coords[1]) / (max[3] - max[1]))
    ];
}

function draw(tree, bounds) {
    bounds = bounds || [0, 0, 4096, 4096];
    rects = [];
    drawTree(tree.data, 0, tree.data.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, W + 1, W + 1);

    // function anim() {
    //     var rect = rects.pop();
    //     if (!rect) return;

    //     ctx.strokeStyle = rect[0];
    //     ctx.globalAlpha = rect[1];

    //     var coords = transformCoords(rect[2], bounds);
    //     ctx.strokeRect.apply(ctx, coords);

    //     requestAnimationFrame(anim);
    // }

    // anim();

    for (var i = rects.length - 1; i >= 0; i--) {
        ctx.strokeStyle = rects[i][0];
        ctx.globalAlpha = rects[i][1];

        var coords = transformCoords(rects[i][2], bounds);

        ctx.strokeRect.apply(ctx, coords);
    }
}
