var W = document.body.offsetWidth - 20,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

canvas.style.width = canvas.style.height = W + 'px';
canvas.width = canvas.height = W;

var colors = ['#f40', '#37f', '#0b0'],
    rects;

function drawTree(node, level) {
    if (!node) { return; }

    var rect = [];

    rect.push(level ? colors[(level - 1) % colors.length] : 'grey');
    // rect.push(level ? 1 / level : 1);
    rect.push(node.leaf ? 1 : 0.3);
    rect.push(node.bbox);

    rects.push(rect);

    if (node.leaf) return;
    // if (level === 6) { return; }

    for (var i = 0; i < node.children.length; i++) {
        drawTree(node.children[i], level + 1);
    }
}

function transformCoords(coords, max) {
    return [
        Math.round(W * (coords[0] - max[0]) / (max[2] - max[0])) + 0.5,
        Math.round(W * (coords[1] - max[1]) / (max[3] - max[1])) + 0.5,
        Math.round(W * (coords[2] - coords[0]) / (max[2] - max[0])),
        Math.round(W * (coords[3] - coords[1]) / (max[3] - max[1]))
    ];
}

function draw(tree, bounds) {
    bounds = bounds || [0, 0, 4096, 4096];
    rects = [];
    drawTree(tree.data, 0);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, W + 1, W + 1);

    for (var i = rects.length - 1; i >= 0; i--) {
        ctx.strokeStyle = rects[i][0];
        ctx.globalAlpha = rects[i][1];

        var coords = transformCoords(rects[i][2], bounds);

        ctx.strokeRect.apply(ctx, coords);
    }
}
