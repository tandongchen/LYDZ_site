"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

type GameStatus = "playing" | "success";

type Shape = {
  id: string;
  name: string;
  width: number;
  height: number;
  points: number[][];
};

type Piece = {
  id: number;
  shape: Shape;
  rotation: number;
  x: number;
  y: number;
  initialX: number;
  initialY: number;
  targetX: number;
  targetY: number;
};

type Challenge = {
  seed: number;
  pieces: Piece[];
};

type PieceSpec = {
  shapeId: string;
  x: number;
  y: number;
  rotation: number;
};

type GridPieceSpec = {
  shapeId: string;
  col: number;
  row: number;
  rotation: number;
};

type DragState = {
  id: number;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

const BOARD_WIDTH = 700;
const BOARD_HEIGHT = 420;
const GRID = 10;
const SHAPE_UNIT = 40;

const SHAPES: Shape[] = [
  { id: "unit-square", name: "单位正方形", width: 40, height: 40, points: [[0, 0], [100, 0], [100, 100], [0, 100]] },
  { id: "square", name: "正方形", width: 120, height: 120, points: [[0, 0], [100, 0], [100, 100], [0, 100]] },
  { id: "small-square", name: "小正方形", width: 80, height: 80, points: [[0, 0], [100, 0], [100, 100], [0, 100]] },
  { id: "rectangle", name: "窄矩形", width: 40, height: 120, points: [[0, 0], [100, 0], [100, 100], [0, 100]] },
  { id: "block-rectangle", name: "宽矩形", width: 80, height: 120, points: [[0, 0], [100, 0], [100, 100], [0, 100]] },
  { id: "triangle", name: "直角三角形", width: 120, height: 120, points: [[0, 0], [100, 0], [0, 100]] },
  { id: "trapezoid", name: "梯形", width: 138, height: 104, points: [[22, 0], [78, 0], [100, 100], [0, 100]] },
  { id: "ell", name: "L 形", width: 120, height: 120, points: [[0, 0], [100, 0], [100, 33.333], [33.333, 33.333], [33.333, 100], [0, 100]] },
  { id: "parallelogram", name: "平行四边形", width: 138, height: 104, points: [[24, 0], [100, 0], [76, 100], [0, 100]] },
  { id: "tee", name: "T 形", width: 120, height: 120, points: [[0, 0], [100, 0], [100, 33.333], [66.667, 33.333], [66.667, 100], [33.333, 100], [33.333, 33.333], [0, 33.333]] },
];

const PUZZLE_TEMPLATES: Record<number, PieceSpec[][]> = {
  1: [
    [{ shapeId: "triangle", x: 350, y: 200, rotation: 0 }],
    [{ shapeId: "trapezoid", x: 350, y: 200, rotation: 0 }],
    [{ shapeId: "ell", x: 350, y: 200, rotation: 0 }],
  ],
  2: [
    [
      { shapeId: "ell", x: 320, y: 200, rotation: 0 },
      { shapeId: "ell", x: 380, y: 200, rotation: 90 },
    ],
    [
      { shapeId: "triangle", x: 320, y: 200, rotation: 0 },
      { shapeId: "triangle", x: 380, y: 200, rotation: 90 },
    ],
    [
      { shapeId: "parallelogram", x: 320, y: 200, rotation: 0 },
      { shapeId: "parallelogram", x: 380, y: 200, rotation: 180 },
    ],
  ],
  3: [
    [
      { shapeId: "ell", x: 320, y: 210, rotation: 0 },
      { shapeId: "ell", x: 380, y: 210, rotation: 90 },
      { shapeId: "square", x: 350, y: 180, rotation: 0 },
    ],
    [
      { shapeId: "triangle", x: 310, y: 200, rotation: 0 },
      { shapeId: "triangle", x: 390, y: 200, rotation: 90 },
      { shapeId: "tee", x: 350, y: 215, rotation: 0 },
    ],
    [
      { shapeId: "trapezoid", x: 310, y: 210, rotation: 0 },
      { shapeId: "trapezoid", x: 390, y: 210, rotation: 0 },
      { shapeId: "rectangle", x: 350, y: 210, rotation: 90 },
    ],
  ],
  4: [
    [
      { shapeId: "ell", x: 310, y: 210, rotation: 0 },
      { shapeId: "ell", x: 390, y: 210, rotation: 90 },
      { shapeId: "square", x: 350, y: 180, rotation: 0 },
      { shapeId: "rectangle", x: 350, y: 240, rotation: 90 },
    ],
    [
      { shapeId: "triangle", x: 310, y: 180, rotation: 0 },
      { shapeId: "triangle", x: 390, y: 180, rotation: 90 },
      { shapeId: "trapezoid", x: 310, y: 230, rotation: 0 },
      { shapeId: "trapezoid", x: 390, y: 230, rotation: 0 },
    ],
    [
      { shapeId: "parallelogram", x: 310, y: 180, rotation: 0 },
      { shapeId: "parallelogram", x: 390, y: 180, rotation: 180 },
      { shapeId: "ell", x: 320, y: 230, rotation: 0 },
      { shapeId: "ell", x: 380, y: 230, rotation: 90 },
    ],
  ],
  5: [
    [
      { shapeId: "ell", x: 310, y: 210, rotation: 0 },
      { shapeId: "ell", x: 390, y: 210, rotation: 90 },
      { shapeId: "square", x: 350, y: 180, rotation: 0 },
      { shapeId: "rectangle", x: 320, y: 240, rotation: 90 },
      { shapeId: "rectangle", x: 380, y: 240, rotation: 90 },
    ],
    [
      { shapeId: "triangle", x: 310, y: 180, rotation: 0 },
      { shapeId: "triangle", x: 390, y: 180, rotation: 90 },
      { shapeId: "trapezoid", x: 310, y: 230, rotation: 0 },
      { shapeId: "trapezoid", x: 390, y: 230, rotation: 0 },
      { shapeId: "tee", x: 350, y: 210, rotation: 0 },
    ],
    [
      { shapeId: "parallelogram", x: 310, y: 180, rotation: 0 },
      { shapeId: "parallelogram", x: 390, y: 180, rotation: 180 },
      { shapeId: "ell", x: 320, y: 230, rotation: 0 },
      { shapeId: "ell", x: 380, y: 230, rotation: 90 },
      { shapeId: "square", x: 350, y: 210, rotation: 0 },
    ],
  ],
};

const SIMPLE_TARGETS = {
  square2: { width: 2, height: 2 },
  square3: { width: 3, height: 3 },
  rectangle2x3: { width: 2, height: 3 },
  wide5x3: { width: 5, height: 3 },
} as const;

function gridTemplate(
  targetId: keyof typeof SIMPLE_TARGETS,
  specs: GridPieceSpec[],
): PieceSpec[] {
  const target = SIMPLE_TARGETS[targetId];
  const originX = 350 - (2 + target.width / 2) * SHAPE_UNIT;
  const originY = 200 - (2 + target.height / 2) * SHAPE_UNIT;

  return specs.map((spec) => {
    const shape = SHAPES.find((candidate) => candidate.id === spec.shapeId)!;
    const swapsAxes = Math.abs(spec.rotation / 90) % 2 === 1;
    const width = (swapsAxes ? shape.height : shape.width) / SHAPE_UNIT;
    const height = (swapsAxes ? shape.width : shape.height) / SHAPE_UNIT;

    return {
      shapeId: spec.shapeId,
      x: originX + (spec.col + width / 2) * SHAPE_UNIT,
      y: originY + (spec.row + height / 2) * SHAPE_UNIT,
      rotation: spec.rotation,
    };
  });
}

const SIMPLE_PUZZLE_TEMPLATES: Record<number, PieceSpec[][]> = {
  3: [
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
      { shapeId: "unit-square", col: 4, row: 4, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "tee", col: 2, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 4, row: 4, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "ell", col: 2, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "tee", col: 2, row: 2, rotation: 180 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "ell", col: 2, row: 2, rotation: 0 },
      { shapeId: "tee", col: 2, row: 2, rotation: 90 },
      { shapeId: "small-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "triangle", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 90 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "trapezoid", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 180 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
  ],
  4: [
    gridTemplate("wide5x3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "square", col: 4, row: 2, rotation: 0 },
      { shapeId: "rectangle", col: 4, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 4, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "tee", col: 2, row: 2, rotation: 0 },
      { shapeId: "rectangle", col: 3, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 0 },
      { shapeId: "ell", col: 2, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "tee", col: 2, row: 2, rotation: 90 },
      { shapeId: "ell", col: 2, row: 2, rotation: 180 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "triangle", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 180 },
      { shapeId: "small-square", col: 3, row: 3, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "ell", col: 2, row: 2, rotation: 0 },
      { shapeId: "ell", col: 2, row: 2, rotation: 90 },
      { shapeId: "rectangle", col: 2, row: 3, rotation: 90 },
    ]),
    gridTemplate("square3", [
      { shapeId: "trapezoid", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 90 },
      { shapeId: "tee", col: 2, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "parallelogram", col: 2, row: 2, rotation: 0 },
      { shapeId: "parallelogram", col: 2, row: 2, rotation: 180 },
      { shapeId: "tee", col: 2, row: 2, rotation: 90 },
      { shapeId: "small-square", col: 3, row: 3, rotation: 0 },
    ]),
  ],
  5: [
    gridTemplate("wide5x3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "square", col: 4, row: 2, rotation: 0 },
      { shapeId: "rectangle", col: 4, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
      { shapeId: "unit-square", col: 5, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "tee", col: 2, row: 2, rotation: 0 },
      { shapeId: "rectangle", col: 3, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 2, row: 3, rotation: 0 },
      { shapeId: "unit-square", col: 4, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "ell", col: 2, row: 2, rotation: 0 },
      { shapeId: "tee", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "tee", col: 2, row: 2, rotation: 0 },
      { shapeId: "ell", col: 2, row: 2, rotation: 90 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 180 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "square", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 0 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 180 },
      { shapeId: "tee", col: 2, row: 2, rotation: 90 },
      { shapeId: "small-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "ell", col: 2, row: 2, rotation: 0 },
      { shapeId: "ell", col: 2, row: 2, rotation: 90 },
      { shapeId: "tee", col: 2, row: 2, rotation: 180 },
      { shapeId: "rectangle", col: 2, row: 3, rotation: 90 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "trapezoid", col: 2, row: 2, rotation: 0 },
      { shapeId: "trapezoid", col: 2, row: 2, rotation: 180 },
      { shapeId: "triangle", col: 2, row: 2, rotation: 90 },
      { shapeId: "tee", col: 2, row: 2, rotation: 0 },
      { shapeId: "unit-square", col: 3, row: 3, rotation: 0 },
    ]),
    gridTemplate("square3", [
      { shapeId: "parallelogram", col: 2, row: 2, rotation: 0 },
      { shapeId: "parallelogram", col: 2, row: 2, rotation: 180 },
      { shapeId: "ell", col: 2, row: 2, rotation: 90 },
      { shapeId: "tee", col: 2, row: 2, rotation: 270 },
      { shapeId: "small-square", col: 3, row: 3, rotation: 0 },
    ]),
  ],
};

const INITIAL_LAYOUTS: Record<number, Array<[number, number]>> = {
  3: [[150, 325], [350, 325], [550, 325]],
  4: [[150, 285], [350, 285], [250, 350], [450, 350]],
  5: [[150, 275], [350, 275], [550, 275], [250, 345], [450, 345]],
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}

function createChallenge(count: number, seed: number): Challenge {
  const random = seededRandom(seed);
  const templates = SIMPLE_PUZZLE_TEMPLATES[count] ?? PUZZLE_TEMPLATES[count];
  const template = templates[Math.floor(random() * templates.length)];
  const quarterTurns = Math.floor(random() * 4);

  const pieces = template.map((spec, index) => {
    const shape = SHAPES.find((candidate) => candidate.id === spec.shapeId)!;
    let offsetX = spec.x - 350;
    let offsetY = spec.y - 200;
    for (let turn = 0; turn < quarterTurns; turn += 1) {
      [offsetX, offsetY] = [-offsetY, offsetX];
    }
    const targetX = snap(350 + offsetX);
    const targetY = snap(200 + offsetY);
    const [initialX, initialY] = INITIAL_LAYOUTS[count][index];

    return {
      id: index,
      shape,
      rotation: spec.rotation + quarterTurns * 90,
      x: initialX,
      y: initialY,
      initialX,
      initialY,
      targetX,
      targetY,
    };
  });

  return { seed, pieces };
}

function drawMask(pieces: Piece[], useTarget: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = BOARD_WIDTH / 2;
  canvas.height = BOARD_HEIGHT / 2;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.globalCompositeOperation = "xor";
  context.fillStyle = "#000";

  pieces.forEach((piece) => {
    const centerX = (useTarget ? piece.targetX : piece.x) / 2;
    const centerY = (useTarget ? piece.targetY : piece.y) / 2;
    const width = piece.shape.width / 2;
    const height = piece.shape.height / 2;

    context.save();
    context.translate(centerX, centerY);
    context.rotate((piece.rotation * Math.PI) / 180);
    context.beginPath();
    piece.shape.points.forEach(([pointX, pointY], index) => {
      const x = (pointX / 100 - 0.5) * width;
      const y = (pointY / 100 - 0.5) * height;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fill();
    context.restore();
  });

  return {
    data: context.getImageData(0, 0, canvas.width, canvas.height).data,
    width: canvas.width,
    height: canvas.height,
  };
}

function TargetSilhouette({ pieces }: { pieces: Piece[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = BOARD_WIDTH;
    canvas.height = BOARD_HEIGHT;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "xor";
    context.fillStyle = "#000";

    pieces.forEach((piece) => {
      context.save();
      context.translate(piece.targetX, piece.targetY);
      context.rotate((piece.rotation * Math.PI) / 180);
      context.beginPath();
      piece.shape.points.forEach(([pointX, pointY], index) => {
        const x = (pointX / 100 - 0.5) * piece.shape.width;
        const y = (pointY / 100 - 0.5) * piece.shape.height;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.closePath();
      context.fill();
      context.restore();
    });

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const visible = image.data[index + 3] >= 128;
      image.data[index] = 0;
      image.data[index + 1] = 0;
      image.data[index + 2] = 0;
      image.data[index + 3] = visible ? 255 : 0;
    }
    context.globalCompositeOperation = "source-over";
    context.putImageData(image, 0, 0);
  }, [pieces]);

  return <canvas ref={canvasRef} className="target-silhouette" aria-hidden="true" />;
}

function trimMask(mask: ReturnType<typeof drawMask>) {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      const alpha = mask.data[(y * mask.width + x) * 4 + 3];
      if (alpha <= 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return { width: 0, height: 0, pixels: new Uint8Array() };

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = mask.data[((minY + y) * mask.width + minX + x) * 4 + 3];
      pixels[y * width + x] = alpha > 16 ? 1 : 0;
    }
  }

  return { width, height, pixels };
}

function isSolved(pieces: Piece[]) {
  const current = trimMask(drawMask(pieces, false));
  const target = trimMask(drawMask(pieces, true));
  if (current.width !== target.width || current.height !== target.height) return false;
  for (let index = 0; index < current.pixels.length; index += 1) {
    if (current.pixels[index] !== target.pixels[index]) return false;
  }
  return true;
}

function pieceStyle(piece: Piece, target = false): CSSProperties {
  const x = target ? piece.targetX : piece.x;
  const y = target ? piece.targetY : piece.y;
  return {
    left: `${(x / BOARD_WIDTH) * 100}%`,
    top: `${(y / BOARD_HEIGHT) * 100}%`,
    width: `${(piece.shape.width / BOARD_WIDTH) * 100}%`,
    aspectRatio: `${piece.shape.width} / ${piece.shape.height}`,
    clipPath: `polygon(${piece.shape.points.map(([px, py]) => `${px}% ${py}%`).join(",")})`,
    transform: `translate(-50%, -50%) rotate(${piece.rotation}deg)`,
  };
}

function FusionStage({
  pieces,
  target = false,
  selectedId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
}: {
  pieces: Piece[];
  target?: boolean;
  selectedId?: number | null;
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>, piece: Piece) => void;
  onPointerMove?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>, piece: Piece) => void;
}) {
  return (
    <div className={`fusion-stage ${target ? "target-stage" : "answer-stage"}`}>
      <div className="stage-axis axis-x" aria-hidden="true" />
      <div className="stage-axis axis-y" aria-hidden="true" />
      {target ? (
        <TargetSilhouette pieces={pieces} />
      ) : (
        pieces.map((piece) => (
          <button
            key={piece.id}
            type="button"
            className={`fusion-piece draggable-piece ${selectedId === piece.id ? "is-selected" : ""}`}
            style={pieceStyle(piece)}
            aria-label={`移动${piece.shape.name}，方向键可微调`}
            onPointerDown={(event) => onPointerDown?.(event, piece)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(event) => onKeyDown?.(event, piece)}
          />
        ))
      )}
    </div>
  );
}

const INITIAL_CHALLENGE = createChallenge(3, 173);

export default function Home() {
  const [pieceCount, setPieceCount] = useState(3);
  const [challenge, setChallenge] = useState(INITIAL_CHALLENGE);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [moves, setMoves] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);

  function replacePieces(pieces: Piece[], countMove = false) {
    setChallenge((current) => ({ ...current, pieces }));
    if (countMove) setMoves((current) => current + 1);
    setStatus(isSolved(pieces) ? "success" : "playing");
  }

  function generateChallenge(count = pieceCount) {
    const seed = (challenge.seed * 1664525 + 1013904223) >>> 0;
    setPieceCount(count);
    setChallenge(createChallenge(count, seed));
    setStatus("playing");
    setMoves(0);
    setSelectedId(null);
    dragRef.current = null;
  }

  function resetChallenge() {
    const pieces = challenge.pieces.map((piece) => ({ ...piece, x: piece.initialX, y: piece.initialY }));
    setChallenge((current) => ({ ...current, pieces }));
    setStatus("playing");
    setMoves(0);
    setSelectedId(null);
  }

  function hintOnePiece() {
    const piece = challenge.pieces.find((item) => item.x !== item.targetX || item.y !== item.targetY);
    if (!piece) return;
    const pieces = challenge.pieces.map((item) =>
      item.id === piece.id ? { ...item, x: item.targetX, y: item.targetY } : item,
    );
    setSelectedId(piece.id);
    replacePieces(pieces, true);
  }

  function pointerCoordinates(event: PointerEvent<HTMLButtonElement>) {
    const stage = event.currentTarget.parentElement!.getBoundingClientRect();
    return {
      x: ((event.clientX - stage.left) / stage.width) * BOARD_WIDTH,
      y: ((event.clientY - stage.top) / stage.height) * BOARD_HEIGHT,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, piece: Piece) {
    if (status === "success") return;
    const point = pointerCoordinates(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: piece.id,
      pointerId: event.pointerId,
      offsetX: point.x - piece.x,
      offsetY: point.y - piece.y,
    };
    setSelectedId(piece.id);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = pointerCoordinates(event);
    const currentPiece = challenge.pieces.find((piece) => piece.id === drag.id)!;
    const halfWidth = currentPiece.shape.width / 2;
    const halfHeight = currentPiece.shape.height / 2;
    const x = Math.max(halfWidth, Math.min(BOARD_WIDTH - halfWidth, point.x - drag.offsetX));
    const y = Math.max(halfHeight, Math.min(BOARD_HEIGHT - halfHeight, point.y - drag.offsetY));
    setChallenge((current) => ({
      ...current,
      pieces: current.pieces.map((piece) => (piece.id === drag.id ? { ...piece, x, y } : piece)),
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = pointerCoordinates(event);
    const draggedPiece = challenge.pieces.find((piece) => piece.id === drag.id)!;
    const boundary = Math.max(draggedPiece.shape.width, draggedPiece.shape.height) / 2;
    const x = snap(Math.max(boundary, Math.min(BOARD_WIDTH - boundary, point.x - drag.offsetX)));
    const y = snap(Math.max(boundary, Math.min(BOARD_HEIGHT - boundary, point.y - drag.offsetY)));
    const pieces = challenge.pieces.map((piece) => piece.id === drag.id ? { ...piece, x, y } : piece);
    dragRef.current = null;
    replacePieces(pieces, true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, piece: Piece) {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-GRID, 0],
      ArrowRight: [GRID, 0],
      ArrowUp: [0, -GRID],
      ArrowDown: [0, GRID],
    };
    const direction = directions[event.key];
    if (!direction || status === "success") return;
    event.preventDefault();
    const [dx, dy] = direction;
    const halfWidth = piece.shape.width / 2;
    const halfHeight = piece.shape.height / 2;
    const pieces = challenge.pieces.map((item) =>
      item.id === piece.id
        ? {
            ...item,
            x: Math.max(halfWidth, Math.min(BOARD_WIDTH - halfWidth, item.x + dx)),
            y: Math.max(halfHeight, Math.min(BOARD_HEIGHT - halfHeight, item.y + dy)),
          }
        : item,
    );
    setSelectedId(piece.id);
    replacePieces(pieces, true);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="魔法数学首页">
          <span className="brand-mark magic-hat" aria-hidden="true"><span>✦</span></span>
          <span>魔法数学</span>
        </a>
        <span className="header-tag">数学思维小游戏</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span />PARITY PUZZLE<span /></div>
          <h1 aria-label="层叠消融"><span>层</span><span>叠</span><span>消</span><span>融</span></h1>
          <p className="hero-lead">把重叠，变成<em>答案。</em></p>
          <p className="hero-description">
            黑色图形相遇时，重叠一次变白，再叠一次又变黑。移动每一块图形，
            用奇与偶的规律拼出上方目标。
          </p>
        </div>
        <div className="hero-art parity-art" aria-hidden="true">
          <i className="parity-shape parity-one" />
          <i className="parity-shape parity-two" />
          <span className="parity-label">奇 · 黑<br />偶 · 白</span>
        </div>
      </section>

      <section className="game-shell" aria-label="层叠消融游戏区">
        <div className="setup-panel">
          <div className="setup-heading">
            <span className="section-kicker">01 · SET THE PIECES</span>
            <h2>先选择图形个数</h2>
            <p>3—5 块均可挑战。图形越多、黑白缺口越丰富，反推消融步骤越烧脑。</p>
          </div>
          <div className="setup-controls">
            <fieldset className="size-picker">
              <legend>本局使用</legend>
              <div className="count-options">
                {[3, 4, 5].map((count) => (
                  <button
                    type="button"
                    key={count}
                    className={pieceCount === count ? "selected" : ""}
                    onClick={() => generateChallenge(count)}
                    aria-pressed={pieceCount === count}
                  >
                    <strong>{count}</strong><span>块图形</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="new-game-button" type="button" onClick={() => generateChallenge()}>
              随机生成新目标 <span>↗</span>
            </button>
          </div>
        </div>

        <div className="game-divider" />

        <div className="status-row">
          <span className={`status-orb status-${status}`}>{status === "success" ? "✓" : "∿"}</span>
          <div className="turn-status" aria-live="polite">
            <small>{status === "success" ? "CHALLENGE COMPLETE" : "YOUR TURN"}</small>
            <strong>{status === "success" ? "图形完全一致，挑战成功！" : "拖动图形，复刻目标轮廓"}</strong>
            <p>{status === "success" ? "奇偶叠加的每一处都对上了。" : "松开鼠标后会自动吸附到点阵。"}</p>
          </div>
          <div className="game-metrics">
            <span><strong>{moves}</strong> 次移动</span>
            <span><strong>{pieceCount}</strong> 块图形</span>
          </div>
        </div>

        <div className={`result-banner result-${status}`}>
          <span className="result-mark">{status === "success" ? "MATCH" : "XOR"}</span>
          <p>
            <strong>{status === "success" ? "漂亮的消融！" : "奇数层保留黑色，偶数层消成白色"}</strong>
            {status === "success" ? "可以换一组图形继续挑战。" : "只看最终黑白轮廓；整体放在答题区的任何位置都可以。"}
          </p>
          <div className="result-actions">
            <button type="button" onClick={resetChallenge}>还原位置</button>
            <button type="button" onClick={status === "success" ? () => generateChallenge() : hintOnePiece}>
              {status === "success" ? "下一题" : "提示一步"}
            </button>
          </div>
        </div>

        <section className="target-zone" aria-labelledby="target-heading">
          <div className="zone-heading">
            <span><b>02</b><small>TARGET</small></span>
            <div><h2 id="target-heading">目标图形</h2><p>观察黑白相间的规则构型，反推出多次叠加与相消。</p></div>
          </div>
          <div className="target-frame">
            <FusionStage pieces={challenge.pieces} target />
          </div>
        </section>

        <section className="answer-zone" aria-labelledby="answer-heading">
          <div className="zone-heading">
            <span><b>03</b><small>WORKSPACE</small></span>
            <div><h2 id="answer-heading">答题区域</h2><p>用鼠标或触摸拖动；整体位置不同也能判定成功。</p></div>
            <span className="placed-note">位置不限</span>
          </div>
          <div className="answer-frame">
            <FusionStage
              pieces={challenge.pieces}
              selectedId={selectedId}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="board-footnote">
            <span><i className="dot dot-grid" />每一格 = 10 个位置单位</span>
            <span><i className="dot dot-black" />奇数次重叠</span>
            <span><i className="dot dot-white" />偶数次重叠</span>
            <p>让黑与白共同完成图形。</p>
          </div>
        </section>
      </section>

      <section className="lower-grid">
        <article className="rules-card">
          <div className="card-heading">
            <span className="card-number">04</span>
            <div><small>GAME RULES</small><h2>怎么玩？</h2></div>
          </div>
          <ol>
            <li><span>一</span><p><strong>选择数量</strong>选择 3—5 块图形，系统从分级题库生成一题必定可解的目标。</p></li>
            <li><span>二</span><p><strong>移动图形</strong>按住答题区中的黑色图形，把它拖到新的位置。</p></li>
            <li><span>三</span><p><strong>观察消融</strong>同一区域叠两层变白，叠三层又恢复黑色。</p></li>
            <li><span>四</span><p><strong>完成匹配</strong>最终黑白轮廓与目标形状一致即可，整体位置不限。</p></li>
          </ol>
        </article>

        <article className="history-card parity-card">
          <div className="card-heading">
            <span className="card-number">∿</span>
            <div><small>PARITY SECRET</small><h2>藏在重叠里的数学</h2></div>
          </div>
          <div className="parity-equation" aria-label="一层为黑，两层为白，三层为黑">
            <span><i className="mini-shape one" /><b>1 层</b><small>黑</small></span>
            <em>→</em>
            <span><i className="mini-shape two" /><b>2 层</b><small>白</small></span>
            <em>→</em>
            <span><i className="mini-shape three" /><b>3 层</b><small>黑</small></span>
          </div>
          <div className="strategy-note">
            <span>✦</span>
            <p><strong>小策略</strong>先找目标中最完整的大轮廓，再利用其他图形“挖掉”白色缺口，通常会更容易。</p>
          </div>
        </article>
      </section>

      <footer>
        <span>魔法数学</span>
        <p>在动手中看见规律，在重叠里找到答案。</p>
        <small>黑白无间道</small>
      </footer>
    </main>
  );
}

