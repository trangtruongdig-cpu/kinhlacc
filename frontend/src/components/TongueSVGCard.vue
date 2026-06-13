<script setup lang="ts">
import type { SvgParams, AtlasFeature } from '@/data/tongue-atlas'

const props = defineProps<{ params: SvgParams; size?: number }>()

const W = 200, H = 280
const CX = 100, CY = 147, RX = 87, RY = 120

function scaledRX() { return RX * (props.params.bodyScale ?? 1) }
function scaledRY() { return RY * (props.params.bodyScale ?? 1) }

function has(f: AtlasFeature) { return (props.params.features ?? []).includes(f) }

// Coating coverage clip
function coatingRect() {
  const cov = props.params.coatingCoverage
  if (cov === 'root')    return { x: CX - RX, y: CY + 40, w: RX * 2, h: RY - 40 }
  if (cov === 'partial') return { x: CX - RX * 0.7, y: CY - 20, w: RX * 1.4, h: RY + 10 }
  return { x: CX - RX, y: CY - RY, w: RX * 2, h: RY * 2 }
}

// Generate crack paths
const CRACKS = [
  'M 95 100 L 98 140 L 96 180',
  'M 105 110 L 108 155 L 103 185',
  'M 80 130 L 85 160',
  'M 115 125 L 112 165',
  'M 100 90 L 97 120',
]

// Generate red dot positions
const RED_DOTS = [
  { cx: 95, cy: 80 }, { cx: 110, cy: 75 }, { cx: 85, cy: 90 },
  { cx: 105, cy: 100 }, { cx: 92, cy: 108 }, { cx: 118, cy: 95 },
  { cx: 78, cy: 115 }, { cx: 88, cy: 130 },
]

// Peeling patch paths (irregular areas without coating)
const PEELING_PATCHES = [
  'M 90 100 Q 108 95 115 115 Q 110 130 95 128 Q 82 120 90 100',
  'M 75 145 Q 88 138 98 152 Q 90 165 76 160 Q 68 153 75 145',
  'M 108 155 Q 120 148 128 162 Q 125 175 112 172 Q 103 165 108 155',
]

// Zone highlight rect (for zone-specific patterns)
function zoneHighlight() {
  if (has('zone-tip'))    return { x: 13, y: 27,  w: 174, h: 72,  fill: '#ff6060' }
  if (has('zone-root'))   return { x: 13, y: 187, w: 174, h: 76,  fill: '#8080ff' }
  if (has('zone-sides'))  return null // handled separately
  if (has('zone-center')) return { x: 71, y: 99,  w: 58,  h: 88,  fill: '#ffa040' }
  return null
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    :width="size ?? 160"
    :height="(size ?? 160) * (H / W)"
    class="tongue-svg-card"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Main tongue clip -->
      <clipPath id="tsc-clip">
        <ellipse :cx="CX" :cy="CY" :rx="scaledRX()" :ry="scaledRY()"/>
      </clipPath>

      <!-- Coating clip (partial/root coverage) -->
      <clipPath id="tsc-coat-clip">
        <rect
          :x="coatingRect().x" :y="coatingRect().y"
          :width="coatingRect().w" :height="coatingRect().h"
          clip-path="url(#tsc-clip)"
        />
      </clipPath>

      <!-- Greasy gloss gradient -->
      <radialGradient id="tsc-gloss" cx="35%" cy="30%" r="55%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>

      <!-- Tongue body gradient (depth) -->
      <radialGradient id="tsc-body-grad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.15"/>
      </radialGradient>
    </defs>

    <!-- ── Tongue body ── -->
    <ellipse
      :cx="CX" :cy="CY"
      :rx="scaledRX()" :ry="scaledRY()"
      :fill="params.bodyColor"
      stroke="#9a5050" stroke-width="1.5"
    />
    <!-- Depth shading -->
    <ellipse
      :cx="CX" :cy="CY"
      :rx="scaledRX()" :ry="scaledRY()"
      fill="url(#tsc-body-grad)"
    />

    <!-- ── Tooth marks (scalloped edge) ── -->
    <g v-if="has('tooth-marks')" clip-path="url(#tsc-clip)">
      <circle v-for="i in 8" :key="i"
        :cx="CX + scaledRX() * Math.sin((i - 0.5) * Math.PI / 4)"
        :cy="CY + scaledRY() * 0.1 * Math.cos((i - 0.5) * Math.PI / 4)"
        r="9"
        fill="none"
        stroke="#b08878"
        stroke-width="5"
        opacity="0.35"
      />
    </g>

    <!-- ── Coating layer ── -->
    <g v-if="params.coatingColor">
      <ellipse
        :cx="CX" :cy="CY"
        :rx="scaledRX() - 2" :ry="scaledRY() - 2"
        :fill="params.coatingColor"
        :opacity="params.coatingOpacity ?? 0.6"
        clip-path="url(#tsc-coat-clip)"
      />
    </g>

    <!-- ── Peeling patches (hole in coating) ── -->
    <g v-if="has('peeling') && params.coatingColor" clip-path="url(#tsc-clip)">
      <!-- Show coating base -->
      <ellipse :cx="CX" :cy="CY" :rx="scaledRX() - 2" :ry="scaledRY() - 2"
        fill="#e8e0d8" opacity="0.55"/>
      <!-- Cut out peeling areas — show body underneath -->
      <path v-for="(d, i) in PEELING_PATCHES" :key="i"
        :d="d" :fill="params.bodyColor" opacity="0.9"/>
    </g>

    <!-- ── Zone highlights ── -->
    <g v-if="zoneHighlight()" clip-path="url(#tsc-clip)">
      <rect
        :x="zoneHighlight()!.x" :y="zoneHighlight()!.y"
        :width="zoneHighlight()!.w" :height="zoneHighlight()!.h"
        :fill="zoneHighlight()!.fill"
        opacity="0.3"
      />
    </g>
    <!-- Zone-sides: left + right highlight -->
    <g v-if="has('zone-sides')" clip-path="url(#tsc-clip)">
      <rect x="13"  y="99" width="58" height="88" fill="#ff9040" opacity="0.3"/>
      <rect x="129" y="99" width="58" height="88" fill="#ff9040" opacity="0.3"/>
    </g>

    <!-- ── Crack lines ── -->
    <g v-if="has('cracks')" clip-path="url(#tsc-clip)">
      <path v-for="(d, i) in CRACKS" :key="i"
        :d="d"
        fill="none"
        stroke="#8a3030"
        stroke-width="1.2"
        opacity="0.6"
        stroke-linecap="round"
      />
    </g>

    <!-- ── Red dots ── -->
    <g v-if="has('red-dots')" clip-path="url(#tsc-clip)">
      <circle v-for="(dot, i) in RED_DOTS" :key="i"
        :cx="dot.cx" :cy="dot.cy"
        r="3.5"
        fill="#cc2020"
        opacity="0.8"
      />
    </g>

    <!-- ── Greasy gloss effect ── -->
    <ellipse v-if="has('greasy')"
      :cx="CX" :cy="CY"
      :rx="scaledRX() - 2" :ry="scaledRY() - 2"
      fill="url(#tsc-gloss)"
      clip-path="url(#tsc-clip)"
    />

    <!-- ── Inner texture line (tongue centerline) ── -->
    <line
      :x1="CX" :y1="CY - scaledRY() + 20"
      :x2="CX" :y2="CY + scaledRY() - 20"
      stroke="#9a5050" stroke-width="0.6" opacity="0.25"
      clip-path="url(#tsc-clip)"
    />
  </svg>
</template>

<style scoped>
.tongue-svg-card {
  display: block;
  filter: drop-shadow(0 2px 6px rgba(80, 30, 20, 0.18));
}
</style>
