const COLOR_CURSOR = '#313131'
const COLOR_WAVE = '#D8B310'
const COLOR_WAVE_PROGRESS = '#EAEAEA'
const COLOR_WAVE_2 = '#715B38'

// Defaults for Wavesurfer.create()
export const DEFAULTS_WAVESURFER = {
  backend: 'MediaElement',
  mediaControls: false,
  waveColor: COLOR_WAVE,
  waveColor1: COLOR_WAVE,
  waveColor2: COLOR_WAVE_2,
  progressColor: COLOR_WAVE_PROGRESS,
  cursorColor: COLOR_CURSOR,
  barWidth: 1,
  barGap: 0,
  minPxPerSec: 1,
  skipLength: 10, // skip Xs for or backward
  fillParent: true,
  scrollParent: false,
  hideScrollbar: false,
  interact: true,
  responsive: true,
  normalize: true,
  dragSelection: true
}

// Defaults for VueWavesurfer props
export const DEFAULT_CONFIG = {
  height: 48,
  size: 12,
  center: true,
  splitChannels: true,
  muted: false,
  peaks: false,
  customRenderer: true,
  drawType: 'default', // default|halfh|h75|t75b25|t0b1
  canEdit: false,
  gradient: true,
  scaleMax: false, // scale peaks in step by average (default) or by max if true
  store: false, // save changed settings to localStorage and restore after reload
  ipeaks: {
    s: 'rgba(255, 0, 0, 0.5)',
    sr: 'rgba(255, 0, 0, 0.2)',
    i: '#aaaa00'
  }
}

export const DEFAULT_CALLBACKS = {
  onLoadAction: () => {},
  onPlayAction: () => {}
}
