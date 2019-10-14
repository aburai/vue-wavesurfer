const _DEBUG = false

export default function customDrawBars(wavesurfer, peaks, channelIndex, start, end, config, colormap, ipeaks) {
    return wavesurfer.drawer.prepareDraw(peaks, channelIndex, start, end, function (_ref) {
        // if drawBars was called within ws.empty we don't pass a start and
        // don't want anything to happen
        if (typeof start === 'undefined') return
        if (!_ref.peaks.length) return

        const drawer = wavesurfer.drawer
        let width = drawer.width
        if (!width) return

        // const preloadedPeaks = !(wavesurfer.backend.buffer && wavesurfer.backend.buffer.duration)

        const {halfPixel} = drawer
        const {absmax, hasMinVals, height, offsetY, halfH} = _ref
        const dpeaks = _ref.peaks
        // const {barWidth = 1, pixelRatio, barGap = 1, useGradient} = wavesurfer.params
        const {barWidth = 1, pixelRatio, barGap = 1, drawType = 'default', useGradient} = wavesurfer.params
        // const {drawType} = config
        const peakIndexScale = hasMinVals ? 2 : 1
        const length = dpeaks.length / peakIndexScale
        const bar = barWidth * pixelRatio
        const gap = barGap === 0 ? 0 : !barGap
            ? Math.max(pixelRatio, ~~(bar / 2))
            : Math.max(pixelRatio, barGap * pixelRatio)
        const step = bar + gap
        if (width + 1 === length) width += 1 // NOTE wavesurfer issue: wrong peaks.length, diff = 1px
        const scale = length / width
        const first = start
        const last = isNaN(end) ? length - 1 : end

        // FIXME split channels = false sets an offset above 32k
        // NOTE could be when "width = 0"
        const offY = offsetY > 1000 ? 0 : offsetY

        const topBottomGap = 1
        let topRatio = offY === 0 ? 1 : 0
        let bottomRatio = offY === 0 ? 0 : 1
        if (drawType === 't75b25') {
            topRatio = offY === 0 ? 0.75 : 0
            bottomRatio = offY === 0 ? 0 : 0.25
        }

        const {waveColorGradient1, waveColorGradient2, waveColor1, waveColor2, waveColor} = wavesurfer.params
        const color1 = (useGradient ? waveColorGradient1 : waveColor1) || waveColor
        const color2 = (useGradient ? waveColorGradient2 : waveColor2) || waveColor
        const s_color = config.ipeaks.s
        const i_color = config.ipeaks.i
        const peakColor = (peak, color) => {
          if (colormap && colormap.length) {
            const heat = Math.round(peak * colormap.length)
            // console.log('peak', peak, heat, colormap[heat])
            if (colormap[heat]) return colormap[heat]
          }
          if (color) return color
          return offY ? color2 : color1
        }

        let h, fx, fy, fwidth, fheight
        let i, p, pn, peak
        let runs = 0
        if (_DEBUG) console.log('first, last, step', first, last, step)
        for (i = first; i < last; i += step) {
            runs++
            p = Math.floor(i * scale * peakIndexScale) // calc current peak index
            pn = Math.floor((i + step) * scale * peakIndexScale) - p // calc next peak index
            peak = dpeaks[p] || 0 // get peak from this step
          if (_DEBUG) console.log('p, pn, peak', p, pn, peak)
            // if (peakIndexScale === 1 && pn >= 2) { // if we have more than one peak in this step
            if (pn >= 2) { // if we have more than one peak in this step
                const peaksScale = dpeaks.slice(p, p + pn)
                if (config.scaleMax) peak = Math.max(...peaksScale) // get max peak from peaks in sample step
                else peak = peaksScale.reduce((p, c) => p + Math.abs(c), 0) / pn // get avg peak from peaks in sample step
            }

            // draw peak with just one fillrect
            if (drawType === 'default' || drawType === 'reflection' || drawType === 'halfh' || drawType === 'h75') {
                h = Math.abs(Math.round(peak / absmax * halfH))
                fx = i + halfPixel
                fy = halfH - h + offY
                fwidth = bar + halfPixel
                fheight = h * 2 // reflect peak from top to bottom
                if (drawType === 'halfh') {
                    fy += h * 0.5
                    fheight = Math.abs(h)
                }
                else if (drawType === 'h75') {
                    fy += h * 0.25
                    fheight = Math.abs(h / 0.75)
                }

                if (fwidth && fheight) {
                    wavesurfer.params.waveColor = peakColor(peak)
                    drawer.fillRect(fx, fy, fwidth, fheight)
                }
            }
            // draw peak for upper and lower bar
            else {
                h = Math.abs(Math.round(peak / absmax * height))
                // Upper bar
                fx = i + halfPixel
                fy = height + offY - (h * topRatio)
                fwidth = bar + halfPixel
                fheight = h * topRatio

                if (fwidth && fheight) {
                    wavesurfer.params.waveColor = peakColor(peak, color1)
                    drawer.fillRect(fx, fy, fwidth, fheight)
                }

                // Recalculate for lower bar
                fy = (height * topRatio) + offY + topBottomGap
                fheight = h * bottomRatio

                if (fwidth && fheight) {
                    wavesurfer.params.waveColor = peakColor(peak, color2)
                    drawer.fillRect(fx, fy, fwidth, fheight)
                }
            }

            if (ipeaks && (ipeaks[p] || '').trim()) {
                if (ipeaks.slice(p, p + pn).indexOf(' ') === -1) {
                  wavesurfer.params.waveColor = ipeaks[p] === 'i' ? i_color : s_color
                  drawer.fillRect(fx, 1, fwidth, 2)
                }
            }
        }
    })
}

export function defaultDrawBars(wavesurfer, peaks, channelIndex, start, end) {
  return wavesurfer.drawer.prepareDraw(peaks, channelIndex, start, end, function ({ absmax, hasMinVals, offsetY, halfH, peaks }) {
    // if drawBars was called within ws.empty we don't pass a start and
    // don't want anything to happen
    if (typeof start === 'undefined') return

    const drawer = wavesurfer.drawer
    const params = wavesurfer.params
    const halfPixel = drawer.halfPixel
    // Skip every other value if there are negatives.
    const peakIndexScale = hasMinVals ? 2 : 1
    const length = peaks.length / peakIndexScale
    const bar = params.barWidth * params.pixelRatio
    const gap =
      params.barGap === null
        ? Math.max(params.pixelRatio, ~~(bar / 2))
        : Math.max(
        params.pixelRatio,
        params.barGap * params.pixelRatio
        )
    const step = bar + gap
    const scale = length / (drawer.width + 1)
    const first = start
    const last = end
    let i = first

    console.log('first, last, step', first, last, step)
    for (i; i < last; i += step) {
      const peak = peaks[Math.floor(i * scale * peakIndexScale)] || 0
      const h = Math.round((peak / absmax) * halfH)
      if (h) drawer.fillRect(
        i + halfPixel,
        halfH - h + offsetY,
        bar + halfPixel,
        h * 2
      )
    }
  })
}
