
(() => {
    "use strict";

    const canvas = document.getElementById("battlefield");
    const ctx = canvas.getContext("2d");
    const button = document.getElementById("generateButton");
    const status = document.getElementById("status");

    const SIZE = 9;
    const CELL = 50;

    canvas.width = SIZE * CELL;
    canvas.height = SIZE * CELL;

    // Každý typ překážky se může objevit maximálně jednou.
    const shapes = [
        { name: "A", cells: [[0, 0]], chance: 85, color: "#5b8f59" },
        { name: "B", cells: [[0, 0]], chance: 85, color: "#5c83b5" },
        { name: "C", cells: [[0, 0], [1, 0]], chance: 75, color: "#b58b45" },
        { name: "D", cells: [[0, 0], [0, 1]], chance: 75, color: "#a76d9e" },
        { name: "E", cells: [[0, 0], [1, 0], [1, 1]], chance: 60, color: "#c47b45" },
        { name: "F", cells: [[0, 0], [1, 0], [2, 0]], chance: 60, color: "#579c9a" },
        { name: "G", cells: [[0, 0], [1, 0], [0, 1], [1, 1]], chance: 45, color: "#9279b8" },
        { name: "H", cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]], chance: 30, color: "#b45c5c" }
    ];

    function rotate(cells, turns) {
        let result = cells.map(([x, y]) => [x, y]);

        for (let i = 0; i < turns; i++) {
            result = result.map(([x, y]) => [-y, x]);
        }

        const minX = Math.min(...result.map(p => p[0]));
        const minY = Math.min(...result.map(p => p[1]));

        return result.map(([x, y]) => [x - minX, y - minY]);
    }

    function canPlace(cells, x, y, occupied, protection) {
        for (const [dx, dy] of cells) {
            const px = x + dx;
            const py = y + dy;

            if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) {
                return false;
            }

            for (let oy = -protection; oy <= protection; oy++) {
                for (let ox = -protection; ox <= protection; ox++) {
                    const nx = px + ox;
                    const ny = py + oy;

                    if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) {
                        continue;
                    }

                    if (occupied[ny][nx]) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    function draw(board) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#eeeeee";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const obstacle of board) {
            ctx.fillStyle = obstacle.color;

            for (const [x, y] of obstacle.cells) {
                ctx.fillRect(
                    x * CELL + 2,
                    y * CELL + 2,
                    CELL - 4,
                    CELL - 4
                );
            }

            const minX = Math.min(...obstacle.cells.map(p => p[0]));
            const maxX = Math.max(...obstacle.cells.map(p => p[0]));
            const minY = Math.min(...obstacle.cells.map(p => p[1]));
            const maxY = Math.max(...obstacle.cells.map(p => p[1]));

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                obstacle.name,
                ((minX + maxX + 1) / 2) * CELL,
                ((minY + maxY + 1) / 2) * CELL
            );
        }

        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;

        for (let i = 0; i <= SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL, 0);
            ctx.lineTo(i * CELL, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * CELL);
            ctx.lineTo(canvas.width, i * CELL);
            ctx.stroke();
        }
    }

    function generate() {
        const emptyChance = Math.max(
            0, Math.min(100, Number(document.getElementById("emptyChance").value) || 0)
        );

        const attempts = Math.max(
            1, Math.min(5000, Number(document.getElementById("placementAttempts").value) || 1000)
        );

        const protection = Number(document.getElementById("protectionZone").value) === 1 ? 1 : 0;

        if (Math.random() * 100 < emptyChance) {
            draw([]);
            status.textContent = "Prázdné bojiště";
            return;
        }

        const ordered = shapes
            .filter(shape => Math.random() * 100 < shape.chance)
            .sort((a, b) => b.cells.length - a.cells.length);

        // Omezíme počet restartů, aby generování nikdy nezamrzlo.
        for (let restart = 0; restart < 100; restart++) {
            const occupied = Array.from(
                { length: SIZE },
                () => Array(SIZE).fill(false)
            );

            const board = [];
            let failed = false;

            for (const shape of ordered) {
                let placed = false;

                for (let attempt = 0; attempt < attempts; attempt++) {
                    const cells = rotate(shape.cells, Math.floor(Math.random() * 4));
                    const maxX = Math.max(...cells.map(p => p[0]));
                    const maxY = Math.max(...cells.map(p => p[1]));
                    const x = Math.floor(Math.random() * (SIZE - maxX));
                    const y = Math.floor(Math.random() * (SIZE - maxY));

                    if (!canPlace(cells, x, y, occupied, protection)) {
                        continue;
                    }

                    const placedCells = cells.map(([dx, dy]) => [x + dx, y + dy]);

                    for (const [px, py] of placedCells) {
                        occupied[py][px] = true;
                    }

                    board.push({
                        name: shape.name,
                        color: shape.color,
                        cells: placedCells
                    });

                    placed = true;
                    break;
                }

                if (!placed) {
                    // Začneme znovu, aby se nepoužila neúplná mapa.
                    failed = true;
                    break;
                }
            }

            if (!failed) {
                draw(board);
                status.textContent = `Hotovo: ${board.length} překážek`;
                return;
            }
        }

        // Bezpečná záloha: prázdná mapa místo nekonečného generování.
        draw([]);
        status.textContent = "Nepodařilo se umístit překážky. Zkus Generovat znovu.";
    }

    button.addEventListener("click", generate);
    generate();
})();
