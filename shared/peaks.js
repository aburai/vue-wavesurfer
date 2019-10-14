export default class Peaks {

  // peaks
  //   - must be a single array (merged peaks) or an array of two arrays (split peaks)
  constructor(peaks, duration) {
    if (!peaks || !Array.isArray(peaks)) {
      throw new Error('invalid peaks')
    }

    // this.opeaks = peaks
    this.peaksLength = peaks.length
    if (Array.isArray(peaks[0])) {
      // this.peaks0 = this.normalize(peaks[0])
      // this.peaks1 = this.normalize(peaks[1])
      // this.peaks0 = peaks[0]
      // this.peaks1 = peaks[1]
      this.peaks0 = this.minify(peaks[0])
      this.peaks1 = this.minify(peaks[1])
      this.peaksLength = this.peaks0.length
      if (this.peaks0.length !== this.peaks1.length) {
        throw new Error('splitted peaks has different lengths')
      }
    }
    this.duration = Number(duration)
    this.peaksPerSec = this.peaksLength / this.duration
    this.silence = 10 // in seconds
    this.ipeaks = this.inspect()
    // console.log('this', this)
  }

  get silencePeaksCount() {
    return Math.floor(this.silence * this.peaksPerSec)
  }

  minify(peaks) {
    return peaks.map(peak => Math.round(Math.abs(peak) * 100))
  }

  // check if peaks has min values, if true we filter them out
  // => every peak has a negative reflection [0.0003236722550354898, -0.00034992274595424533]
  normalize(peaks) {
    const hasMinVals = peaks.some(peak => peak < 0)
    return hasMinVals ? peaks.filter((_, i) => i % 2 === 0) : peaks
  }

  inspect(_peaks0, _peaks1, debug) {
    const peaks0 = _peaks0 || this.peaks0
    const peaks1 = _peaks1 || this.peaks1
    const length = peaks0.length

    const ipeaks = []
    let iwf = 0
    let i, p0, p1, info
    for (i = 0; i < length; i++) {
      info = ' '
      p0 = peaks0[i]
      p1 = peaks1[i]
      // p0 = Math.round(Math.abs(peaks0[i]) * 100)
      // p1 = Math.round(Math.abs(peaks1[i]) * 100)
      // if (debug) console.log('p0, p1', p0, p1, p0 === 0 && p1 === 0, peaks0[i], peaks1[i])
      if (p0 === 0 && p1 === 0) {
        info = 's'
      }
      else if (p0 > 20 && p1 > 20) {
        // console.log('p0, p1', p0, p1)
        iwf++
        info = 'i'
      }
      // else {
      //   console.log('p0, p1', p0, p1)
      // }
      ipeaks.push(info)
    }

    const ips = this.silenceInfoPeaks(ipeaks)
    // console.log('length', length)
    // const silence = ips.replace(/ /g, '').length
    // const silPtS = `${Math.round(this.peaksToSeconds(silence))}s`
    // const silPtP = `${Math.round(this.peaksToPercent(silence))}%`
    // console.log('silence', silence, silPtS, silPtP)
    // console.log('iwf', iwf)
    return ips
  }

  // inspect ipeaks for silence detection
  silenceInfoPeaks(ipeaks) {
    const spc = this.silencePeaksCount
    const length = ipeaks.length

    let ips = ''
    let _ip = ''
    let _ipspace = ''

    for (let i = 0; i < length; i++) {
      _ipspace += ' '
      if (ipeaks[i] === 's') _ip += 's'
      else {
        if (_ip.length > spc) ips += _ip + ' '
        else ips += _ipspace
        _ip = ''
        _ipspace = ''
      }
    }

    // append last part, if peaks ends with silence (this is often the case)
    if (_ip.length > spc) ips += _ip
    else ips += _ipspace

    return ips
  }
  silenceSeconds() {
    const silence = this.ipeaks.replace(/ /g, '').length
    return `${Math.round(this.peaksToSeconds(silence))}s`
  }
  silenceRegions() {
    const ips = this.ipeaks
    const il = ips.length
    let start, end
    const regs = []
    for (let i = 0; i < il; i++) {
      if (ips[i] === 's') {
        if (!start) start = i
      }
      else {
        if (start) {
          end = i
          regs.push({start, end})
          start = 0
        }
      }
    }
    // console.log('ips', ips)
    console.log('regs', regs)
    // const pps = Math.floor(this.peaksPerSec)
    const pps = this.peaksPerSec
    return regs.map(reg => {
      const start = Math.round(reg.start / pps)
      const end = Math.round(reg.end / pps)
      return {start, end}
    })
  }

  // return all peaks in a given time region
  peaksFromRegion(start, end) {
    const sp = Math.floor(start * this.peaksPerSec)
    const ep = Math.ceil(end * this.peaksPerSec)
    const peaks0 = this.peaks0.slice(sp, ep)
    const peaks1 = this.peaks1.slice(sp, ep)
    console.log(peaks0)
    console.log(peaks1)
    this.inspect(peaks0, peaks1, true)
  }

  peaksToSeconds(len) {
    return len * this.duration / this.peaksLength
  }
  peaksToPercent(len) {
    return this.peaksToSeconds(len) * 100 / this.duration
  }

}
