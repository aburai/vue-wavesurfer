/*
interface WaveAdapterData {
    bits: number
    channels: number
    data: number[]
    length: number
    sample_rate: number
    samples_per_pixel: number
    version: number
}
*/

const _createPeaks = (peaks) => {
    const peaks1 = []
    const peaks2 = []
    const merged = []

    let min1, max1, min2, max2, p1, p2
    for (let i = 0, il = peaks.length; i < il; i += 4) {
        min1 = peaks[i]
        max1 = peaks[i + 1]
        min2 = peaks[i + 2]
        max2 = peaks[i + 3]

        // TODO option to pick min or max from peak
        // [min||max, min||max, ...]
        p1 = Math.max(Math.abs(min1), max1)
        // p1 = Math.min(Math.abs(min1), max1)
        peaks1.push(p1)
        p2 = Math.max(Math.abs(min2), max2)
        // p2 = Math.min(Math.abs(min2), max2)
        peaks2.push(p2)
        merged.push(Math.max(p1, p2)) // do not use min here

        // [min, max, min, max, ...]
        /*
                peaks1.push(min1, max1)
                peaks2.push(min2, max2)
                merged.push(Math.min(min1, min2), Math.max(max1, max2))
        */
    }
    // console.log('Channel 0', peaks1.length)
    // console.log('Channel 1', peaks2.length)
    // console.log('Merged   ', merged.length)
    // console.log('Channel 0', peaks1.slice(0, 10))
    // console.log('Channel 1', peaks2.slice(0, 10))
    // console.log('Merged   ', merged.slice(0, 10))

    return {peaks1, peaks2, merged}
}

export default class WaveAdapter {
    data
    splitPeaks
    mergedPeaks
    messages

    constructor(data) {
        this.data = data
        this.messages = []

        // TODO use max by bits or by min/max?
        // const min = Math.min(...data.data)
        // const max = Math.max(...data.data)
        // console.log('min, max', min, max)
        // normalize = -min > max ? -min : max;
        const normalize = Math.pow(2, data.bits) / 2
        const peaks = data.data.map(p => p / normalize)
        const {peaks1, peaks2, merged} = _createPeaks(peaks)

        const hasPeaks1 = peaks1.some(p => p > 0)
        const hasPeaks2 = peaks2.some(p => p > 0)
        if (hasPeaks1 && hasPeaks2) this.splitPeaks = [peaks1, peaks2]
        else if (!hasPeaks1) this.messages.push('no peaks: channel 1')
        else if (!hasPeaks2) this.messages.push('no peaks: channel 2')

        this.mergedPeaks = merged
    }

    get channels() {
        return this.data.channels
    }
    get duration() {
        return this.data.length * this.data.samples_per_pixel / this.data.sample_rate
    }
}
