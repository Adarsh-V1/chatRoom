"use client";

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export const VIDEO_FILTERS = {
  none: { label: "Natural", css: "none", needsFace: false },
  mono: { label: "Mono", css: "grayscale(1) contrast(1.08)", needsFace: false },
  warm: {
    label: "Warm",
    css: "saturate(1.18) sepia(0.18) hue-rotate(-8deg) brightness(1.04)",
    needsFace: false,
  },
  cool: {
    label: "Cool",
    css: "saturate(0.9) hue-rotate(12deg) brightness(1.03)",
    needsFace: false,
  },
  vivid: {
    label: "Vivid",
    css: "saturate(1.35) contrast(1.14) brightness(1.05)",
    needsFace: false,
  },
  dream: {
    label: "Dream",
    css: "brightness(1.08) contrast(0.94) saturate(1.12) blur(0.4px)",
    needsFace: false,
  },
  cat: {
    label: "Cat",
    css: "saturate(1.15) contrast(1.06) brightness(1.04)",
    needsFace: true,
  },
  lion: {
    label: "Lion",
    css: "saturate(1.1) sepia(0.16) brightness(1.04) contrast(1.05)",
    needsFace: true,
  },
  anime: {
    label: "Anime",
    css: "saturate(1.34) contrast(1.18) brightness(1.08)",
    needsFace: true,
  },
} as const;

export type VideoFilterId = keyof typeof VIDEO_FILTERS;

type Point = { x: number; y: number };

const LANDMARKS = {
  forehead: 10,
  chin: 152,
  leftEye: 33,
  rightEye: 263,
  leftBrow: 70,
  rightBrow: 300,
  noseTip: 1,
  noseBridge: 6,
  upperLip: 13,
  lowerLip: 14,
  mouthLeft: 61,
  mouthRight: 291,
  leftCheek: 234,
  rightCheek: 454,
} as const;

function scalePoint(
  landmarks: NormalizedLandmark[],
  index: number,
  width: number,
  height: number
): Point {
  const point = landmarks[index];
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  c: Point,
  fill: string,
  stroke?: string
) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawWhiskers(ctx: CanvasRenderingContext2D, nose: Point, span: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(2, span * 0.014);
  ctx.lineCap = "round";
  const offsets = [-0.18, 0, 0.18];
  for (const offset of offsets) {
    const y = nose.y + span * offset;
    ctx.beginPath();
    ctx.moveTo(nose.x - span * 0.1, y);
    ctx.lineTo(nose.x - span * 0.58, y - span * 0.08);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(nose.x + span * 0.1, y);
    ctx.lineTo(nose.x + span * 0.58, y - span * 0.08);
    ctx.stroke();
  }
}

function drawCatOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number
) {
  const leftEye = scalePoint(landmarks, LANDMARKS.leftEye, width, height);
  const rightEye = scalePoint(landmarks, LANDMARKS.rightEye, width, height);
  const leftBrow = scalePoint(landmarks, LANDMARKS.leftBrow, width, height);
  const rightBrow = scalePoint(landmarks, LANDMARKS.rightBrow, width, height);
  const nose = scalePoint(landmarks, LANDMARKS.noseTip, width, height);
  const upperLip = scalePoint(landmarks, LANDMARKS.upperLip, width, height);
  const eyeSpan = distance(leftEye, rightEye);
  const earLift = eyeSpan * 0.95;
  const earWidth = eyeSpan * 0.42;

  drawTriangle(
    ctx,
    { x: leftBrow.x - earWidth * 0.9, y: leftBrow.y - earWidth * 0.1 },
    { x: leftBrow.x + earWidth * 0.05, y: leftBrow.y - earLift },
    { x: leftBrow.x + earWidth * 0.75, y: leftBrow.y + earWidth * 0.2 },
    "#1f1724",
    "rgba(255,220,245,0.8)"
  );
  drawTriangle(
    ctx,
    { x: leftBrow.x - earWidth * 0.5, y: leftBrow.y + earWidth * 0.02 },
    { x: leftBrow.x + earWidth * 0.02, y: leftBrow.y - earLift * 0.68 },
    { x: leftBrow.x + earWidth * 0.45, y: leftBrow.y + earWidth * 0.18 },
    "#ffb7d5"
  );

  drawTriangle(
    ctx,
    { x: rightBrow.x - earWidth * 0.75, y: rightBrow.y + earWidth * 0.2 },
    { x: rightBrow.x - earWidth * 0.05, y: rightBrow.y - earLift },
    { x: rightBrow.x + earWidth * 0.9, y: rightBrow.y - earWidth * 0.1 },
    "#1f1724",
    "rgba(255,220,245,0.8)"
  );
  drawTriangle(
    ctx,
    { x: rightBrow.x - earWidth * 0.45, y: rightBrow.y + earWidth * 0.18 },
    { x: rightBrow.x - earWidth * 0.02, y: rightBrow.y - earLift * 0.68 },
    { x: rightBrow.x + earWidth * 0.5, y: rightBrow.y + earWidth * 0.02 },
    "#ffb7d5"
  );

  ctx.fillStyle = "#ff8ec2";
  ctx.beginPath();
  ctx.moveTo(nose.x, nose.y + eyeSpan * 0.06);
  ctx.lineTo(nose.x - eyeSpan * 0.12, nose.y - eyeSpan * 0.03);
  ctx.lineTo(nose.x + eyeSpan * 0.12, nose.y - eyeSpan * 0.03);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(55,20,40,0.7)";
  ctx.lineWidth = Math.max(2, eyeSpan * 0.012);
  ctx.beginPath();
  ctx.moveTo(nose.x, nose.y + eyeSpan * 0.06);
  ctx.lineTo(nose.x, upperLip.y + eyeSpan * 0.05);
  ctx.stroke();

  drawWhiskers(ctx, nose, eyeSpan);
}

function drawLionOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number
) {
  const forehead = scalePoint(landmarks, LANDMARKS.forehead, width, height);
  const chin = scalePoint(landmarks, LANDMARKS.chin, width, height);
  const leftCheek = scalePoint(landmarks, LANDMARKS.leftCheek, width, height);
  const rightCheek = scalePoint(landmarks, LANDMARKS.rightCheek, width, height);
  const nose = scalePoint(landmarks, LANDMARKS.noseTip, width, height);
  const eyeSpan = distance(leftCheek, rightCheek);
  const center = midpoint(forehead, chin);
  const maneRadius = Math.max(distance(forehead, chin), eyeSpan) * 0.8;

  ctx.save();
  const mane = ctx.createRadialGradient(
    center.x,
    center.y,
    maneRadius * 0.3,
    center.x,
    center.y,
    maneRadius
  );
  mane.addColorStop(0, "rgba(255,220,120,0)");
  mane.addColorStop(0.45, "rgba(196,119,28,0.22)");
  mane.addColorStop(0.7, "rgba(160,92,20,0.58)");
  mane.addColorStop(1, "rgba(96,49,8,0.88)");
  ctx.fillStyle = mane;
  ctx.beginPath();
  ctx.arc(center.x, center.y + maneRadius * 0.06, maneRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const earRadius = eyeSpan * 0.12;
  const leftEar = { x: leftCheek.x + earRadius * 0.2, y: forehead.y - earRadius * 1.2 };
  const rightEar = { x: rightCheek.x - earRadius * 0.2, y: forehead.y - earRadius * 1.2 };
  for (const ear of [leftEar, rightEar]) {
    ctx.fillStyle = "#7c420d";
    ctx.beginPath();
    ctx.arc(ear.x, ear.y, earRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd8a8";
    ctx.beginPath();
    ctx.arc(ear.x, ear.y, earRadius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#7c420d";
  ctx.beginPath();
  ctx.ellipse(nose.x, nose.y + eyeSpan * 0.02, eyeSpan * 0.14, eyeSpan * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,236,186,0.82)";
  ctx.beginPath();
  ctx.ellipse(
    nose.x,
    nose.y + eyeSpan * 0.18,
    eyeSpan * 0.28,
    eyeSpan * 0.19,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  drawWhiskers(ctx, nose, eyeSpan * 0.92);
}

function drawAnimeOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number
) {
  const leftEye = scalePoint(landmarks, LANDMARKS.leftEye, width, height);
  const rightEye = scalePoint(landmarks, LANDMARKS.rightEye, width, height);
  const noseBridge = scalePoint(landmarks, LANDMARKS.noseBridge, width, height);
  const mouthLeft = scalePoint(landmarks, LANDMARKS.mouthLeft, width, height);
  const mouthRight = scalePoint(landmarks, LANDMARKS.mouthRight, width, height);
  const cheekLeft = scalePoint(landmarks, LANDMARKS.leftCheek, width, height);
  const cheekRight = scalePoint(landmarks, LANDMARKS.rightCheek, width, height);
  const eyeSpan = distance(leftEye, rightEye);
  const eyeRadius = eyeSpan * 0.12;

  for (const eye of [leftEye, rightEye]) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.ellipse(eye.x, eye.y, eyeRadius * 1.12, eyeRadius * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(54,111,255,0.95)";
    ctx.beginPath();
    ctx.arc(eye.x, eye.y + eyeRadius * 0.04, eyeRadius * 0.58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(eye.x - eyeRadius * 0.16, eye.y - eyeRadius * 0.2, eyeRadius * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = Math.max(2, eyeSpan * 0.016);
  ctx.beginPath();
  ctx.moveTo(noseBridge.x - eyeSpan * 0.08, noseBridge.y - eyeSpan * 0.44);
  ctx.lineTo(noseBridge.x + eyeSpan * 0.08, noseBridge.y - eyeSpan * 0.62);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,132,188,0.26)";
  ctx.beginPath();
  ctx.arc(cheekLeft.x + eyeSpan * 0.05, cheekLeft.y - eyeSpan * 0.02, eyeSpan * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cheekRight.x - eyeSpan * 0.05, cheekRight.y - eyeSpan * 0.02, eyeSpan * 0.08, 0, Math.PI * 2);
  ctx.fill();

  const mouthCenter = midpoint(mouthLeft, mouthRight);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(2, eyeSpan * 0.012);
  ctx.beginPath();
  ctx.arc(mouthCenter.x, mouthCenter.y, eyeSpan * 0.12, 0.1, Math.PI - 0.1);
  ctx.stroke();
}

export function filterNeedsFace(filter: VideoFilterId): boolean {
  return VIDEO_FILTERS[filter].needsFace;
}

export function drawFaceEffect(
  ctx: CanvasRenderingContext2D,
  filter: VideoFilterId,
  landmarks: NormalizedLandmark[] | null,
  width: number,
  height: number
) {
  if (!landmarks) return;
  if (filter === "cat") {
    drawCatOverlay(ctx, landmarks, width, height);
    return;
  }
  if (filter === "lion") {
    drawLionOverlay(ctx, landmarks, width, height);
    return;
  }
  if (filter === "anime") {
    drawAnimeOverlay(ctx, landmarks, width, height);
  }
}
