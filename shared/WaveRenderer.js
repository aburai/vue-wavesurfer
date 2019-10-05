const _DEBUG = true
function customDrawBars(wavesurfer, peaks, channelIndex, start, end) {
    return wavesurfer.drawer.prepareDraw(peaks, channelIndex, start, end, function (_ref) {
        // if drawBars was called within ws.empty we don't pass a start and
        // don't want anything to happen
        if (start === undefined) return
        if (!_ref.peaks.length) return
        let width = wavesurfer.drawer.getWidth()
        if (!width) return

        const preloadedPeaks = !(wavesurfer.backend.buffer && wavesurfer.backend.buffer.duration)

        if (_DEBUG) {
            console.groupCollapsed('customDrawBars')
            console.time('customDrawBars')
        }

        const {halfPixel} = wavesurfer.drawer
        const {absmax, hasMinVals, height, offsetY, peaks, halfH} = _ref
        const {barWidth = 1, pixelRatio, barGap = 1, drawType = 'default', useGradient} = wavesurfer.params
        const peakIndexScale = hasMinVals ? 2 : 1
        const length = peaks.length / peakIndexScale
        const bar = barWidth * pixelRatio
        const gap = barGap === 0 ? 0 : !barGap
            ? Math.max(pixelRatio, ~~(bar / 2))
            : Math.max(pixelRatio, barGap * pixelRatio)
        const step = bar + gap
        if (width + 1 === length) width += 1 // NOTE wavesurfer issue: wrong peaks.length, diff = 1px
        const scale = length / width
        const first = start
        const last = isNaN(end) ? length - 1 : end

        const cfg = {bar, gap, step, scale, first, last, length, barWidth, barGap, peakIndexScale, drawType, _ref, width}
        if (_DEBUG) console.log(cfg)

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

        if (_DEBUG) preloadedPeaks ? console.group('peaks') : console.groupCollapsed('peaks')

        const {waveColorGradient1, waveColorGradient2, waveColor1, waveColor2, waveColor} = wavesurfer.params
        const color1 = (useGradient ? waveColorGradient1 : waveColor1) || waveColor
        const color2 = (useGradient ? waveColorGradient2 : waveColor2) || waveColor

        let h, fx, fy, fwidth, fheight
        let i, p, pn, peak
        let runs = 0
        for (i = first; i < last; i += step) {
            runs++
            p = Math.floor(i * scale * peakIndexScale) // calc current peak index
            pn = Math.floor((i + step) * scale * peakIndexScale) - p // calc next peak index
            peak = peaks[p] // get peak from this step
            if (peakIndexScale === 1 && pn >= 2) { // if we have more than one peak in this step
                const peaksScale = peaks.slice(p, p + pn)
                // peak = Math.max(...peaksScale) // get max peak from peaks in sample step
                peak = peaksScale.reduce((p, c) => p + Math.abs(c), 0) / pn // get avg peak from peaks in sample step
                if (_DEBUG && i < 20) console.log('p=%s pn=%s peak=%s >', p, pn, peak, peaksScale.join(', '))
            }
            else {
                if (_DEBUG && i < 20) console.log('p=%s pn=%s peak=%s', p, pn, peak)
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
                // if (i<10) console.log('fx, fy, fwidth, fheight', fx, fy, fwidth, fheight, h)
                wavesurfer.params.waveColor = offY ? color2 : color1
                wavesurfer.drawer.fillRect(fx, fy, fwidth, fheight)
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
                    // if (i<20) console.log('upper: fx,fy,fw,fh,h', fx, fy, fwidth, fheight, h)
                    wavesurfer.params.waveColor = color1
                    wavesurfer.drawer.fillRect(fx, fy, fwidth, fheight)
                }

                // Recalculate for lower bar
                fy = (height * topRatio) + offY + topBottomGap
                fheight = h * bottomRatio

                if (fwidth && fheight) {
                    // if (i<20) console.log('lower: fx,fy,fw,fh,h', fx, fy, fwidth, fheight, h)
                    wavesurfer.params.waveColor = color2
                    wavesurfer.drawer.fillRect(fx, fy, fwidth, fheight)
                }
            }
        }

        if (_DEBUG) {
            console.log('runs=%s step=%s chn=%s pre=%s', runs, step, offY ? 2 : 1, preloadedPeaks)
            console.groupEnd()

            console.timeEnd('customDrawBars')
            console.groupEnd()
        }
    })
}

export default customDrawBars
