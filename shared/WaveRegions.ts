/**
 * WaveRegions - a WaveSurfer plugin to manage regions
 *
 * @requires material, Colors
 * @author André Bunse (abu@voixen.com)
 */
import _ from 'lodash'
import '../../modules/material/hoverintent'

/**
 * (Single) WaveRegion plugin class
 *
 * Must be turned into an observer before instantiating.
 * This is done in `WaveRegionsPlugin` (main plugin class).
 */
class WaveRegion {
    element: any
    wavesurfer: any
    wrapper: any

    constructor(params, ws) {
        console.log('create WaveRegion instance', params, ws)
        this.wavesurfer = ws
        this.wrapper = ws.drawer.wrapper
        /*
                this.util = ws.util;
                this.style = this.util.style;

                this.id = params.id == null ? ws.util.getId() : params.id;
                this.start = Number(params.start) || 0;
                this.end =
                    params.end == null
                        ? // small marker-like region
                        this.start +
                        (4 / this.wrapper.scrollWidth) * this.wavesurfer.getDuration()
                        : Number(params.end);
                this.resize =
                    params.resize === undefined ? true : Boolean(params.resize);
                this.drag = params.drag === undefined ? true : Boolean(params.drag);
                this.loop = Boolean(params.loop);
                this.color = params.color || 'rgba(0, 0, 0, 0.1)';
                this.data = params.data || {};
                this.attributes = params.attributes || {};

                this.maxLength = params.maxLength;
                this.minLength = params.minLength;
                this._onRedraw = () => this.updateRender();

                this.scroll = params.scroll !== false && ws.params.scrollParent;
                this.scrollSpeed = params.scrollSpeed || 1;
                this.scrollThreshold = params.scrollThreshold || 10;

                this.bindInOut();
                this.render();
                this.wavesurfer.on('zoom', this._onRedraw);
                this.wavesurfer.on('redraw', this._onRedraw);
                this.wavesurfer.fireEvent('region-created', this);
        */
    }

    /* Remove a single region. */
    remove() {
        if (this.element) {
            // this.container.removeChild(this.element)
            this.element = null
            // this.fireEvent('remove');
            // this.wavesurfer.un('zoom', this._onRedraw);
            // this.wavesurfer.un('redraw', this._onRedraw);
            // this.wavesurfer.fireEvent('region-removed', this);
        }
    }
}

const i18n = (key) => {
    return (window as any).Voixen!.i18n(key)
}
// format time or time range
// method expected time in seconds
// NOTE wavesurfer do not equals with round
const _formatTime = (start, end) => {
    return (Math.round(start) === Math.round(end) ? [start] : [start, end])
        .map(time =>
            [
                Math.floor((time % 3600) / 60), // minutes
                ('00' + Math.round(time % 60)).slice(-2) // seconds
            ].join(':')
        ).join('-')
}

const _template = _.template('<div class="vxtr-region-name" data-regid="<%= id %>">' +
    '<div class="vxtr-region-data"><%= data.name %></div>' +
    '<div class="vxtr-region-descr"><%= data.descr %></div>' +
    '</div>'
)

/**
 * @typedef {Object} WaveRegionsPluginParams
 * @property {?boolean} dragSelection Enable creating regions by dragging with
 * the mouse
 * @property {?RegionParams[]} regions Regions that should be added upon
 * initialisation
 * @property {number} slop=2 The sensitivity of the mouse dragging
 * @property {?number} snapToGridInterval Snap the regions to a grid of the specified multiples in seconds
 * @property {?number} snapToGridOffset Shift the snap-to-grid by the specified seconds. May also be negative.
 * @property {?boolean} deferInit Set to true to manually call
 * `initPlugin('regions')`
 */

/**
 * Regions are visual overlays on waveform that can be used to play and loop
 * portions of audio. Regions can be dragged and resized.
 *
 * Visual customization is possible via CSS (using the selectors
 * `.wavesurfer-region` and `.wavesurfer-handle`).
 *
 * @implements {PluginClass}
 * @extends {Observer}
 *
 * @example
 * // es6
 * import RegionsPlugin from 'wavesurfer.regions.js';
 *
 * // commonjs
 * var RegionsPlugin = require('wavesurfer.regions.js');
 *
 * // if you are using <script> tags
 * var RegionsPlugin = window.WaveSurfer.regions;
 *
 * // ... initialising wavesurfer with the plugin
 * var wavesurfer = WaveSurfer.create({
 *   // wavesurfer options ...
 *   plugins: [
 *     RegionsPlugin.create({
 *       // plugin options ...
 *     })
 *   ]
 * });
 */

export default class WaveRegionsPlugin {
    readonly container
    readonly $container
    params: any = {}
    readonly wavesurfer: any
    // list: any
    wrapper: any
    isReady = false
    playingRegion: any

    /**
     * Regions plugin definition factory
     *
     * This function must be used to create a plugin definition which can be
     * used by wavesurfer to correctly instantiate the plugin.
     *
     * @param {WaveRegionsPluginParams} params parameters use to initialise the plugin
     * @return {PluginDefinition} an object representing the plugin
     */
    static create(params) {
        return {
            name: 'waveregions',
            deferInit: params && params.deferInit ? params.deferInit : false,
            params,
            staticProps: {
                showWaveRegions() {
                    $(this.waveregions.container).show()
                    this.waveregions.syncRegionData()
                },
                hideWaveRegions() {
                    $(this.waveregions.container).hide()
                }
            },
            instance: WaveRegionsPlugin
        }
    }

    constructor(params, ws) {
        console.assert(params.wid, 'WaveRegionsPlugin: params.wid is required!')

        this.params = params
        this.container = 'string' === typeof params.container
            ? document.querySelector(params.container)
            : params.container
        this.$container = $(this.container)
        this.wavesurfer = ws

        this.params.color_region = this.params.color_region || 'rgba(251, 247, 170, 0.75)'
        this.params.alpha_region = this.params.alpha_region || 0.5

        // turn the plugin instance into an observer
        const observerPrototypeKeys = Object.getOwnPropertyNames(ws.util.Observer.prototype)
        observerPrototypeKeys.forEach(key => {
            WaveRegion.prototype[key] = ws.util.Observer.prototype[key]
        })

        // Id-based hash of regions
        // this.list = {}
    }

    // Check if ws is ready
    init() {
        if (this.wavesurfer.isReady) {
            this._onBackendCreated()
            this._onReady()
        } else {
            this.wavesurfer.once('ready', this._onReady.bind(this))
            this.wavesurfer.once('backend-created', this._onBackendCreated.bind(this))
        }
        this.wavesurfer.on('region-created', this._onRegionCreated)
        this.wavesurfer.on('region-update-end', this._onRegionUpdateEnd)
        this.wavesurfer.on('region-removed', this._onRegionRemoved)
        this.wavesurfer.on('region-play', this._onRegionPlay)
        this.wavesurfer.on('pause', this._onPause)
        this.wavesurfer.on('stop', this._onStop)
        this.wavesurfer.on('redraw', this.syncRegionData)
    }

    destroy() {
        this.wavesurfer.un('region-created', this._onRegionCreated)
        this.wavesurfer.un('region-update-end', this._onRegionUpdateEnd)
        this.wavesurfer.un('region-removed', this._onRegionRemoved)
        this.wavesurfer.un('region-play', this._onRegionPlay)
        this.wavesurfer.un('pause', this._onPause)
        this.wavesurfer.un('stop', this._onStop)
        this.wavesurfer.un('redraw', this.syncRegionData)
        this.wavesurfer.un('ready', this._onReady)
        this.wavesurfer.un('backend-created', this._onBackendCreated)
        this.clear()
    }

    _onBackendCreated = () => {
        this.wrapper = this.wavesurfer.drawer.wrapper
        this.wrapper.style.overflow = 'visible'
    }
    _onReady() {
        this.isReady = true
        this.syncRegionData()
        // Object.keys(this.list).forEach(id => {
        //     this.list[id].updateRender()
        // })
    }

    _onRegionCreated = (reg) => {
        // const nreg = new WaveRegion(reg, this.wavesurfer)
        // console.log('nreg', nreg)
        reg.color = reg.data.color || this.params.color_region
        const color = new (window as any).Colors({color: reg.color})
        color.colors.alpha = this.params.alpha_region
        reg.color = color.toString()

        reg.data.range = _formatTime(reg.start, reg.end)
        if (_.isUndefined(reg.data.editable)) reg.data.editable = true

        const $reg = $(reg.element)
        const left = $reg.css('left')
        const regCount = _.size(this.getRegions())
        const _REG_HEIGHT = 22
        const top = regCount * _REG_HEIGHT
        const totalHeight = (regCount + 1) * _REG_HEIGHT
        const $container = this.$container

        $reg.css({background: reg.color})
        $container.height(totalHeight)

        reg.data.name = clean_eml_notation(reg.data.name || '')
        reg.data.descr = clean_eml_notation(reg.data.descr || '')
        // TODO move creation to WaveRegion instance
        const $name = $(_template(reg)).css({top, left})
        $container.append($name)

        const $vis = $('<div>').attr('data-regid-child', reg.id).addClass('vxtr-region-vis')
            .css({ top: totalHeight, left })
            .width($reg.width() as number)
        $container.append($vis)

        const $side = $('<div>').attr('data-regid-child', reg.id).addClass('vxtr-region-side')
            .css({ top: totalHeight })
            .hide()
        // $side.append($('<div/>').addClass('vx-waveform-region-side__range').text(reg.data.range))
        if (!reg.data.editable) {
            $side.append($('<i/>').addClass(reg.data.is_agent ? 'icon-headset' : 'icon-phone'))
        }
        $container.append($side)

        const material = (window as any).material
        if (material) {
            $name.css({paddingLeft: 20})
            const $menu = material.button({
                appendTo: $name,
                label: material.icon('more_vert'),
                icon: true
            })
                .css({position: 'absolute', top: 0, left: 0})
                .on('click', () => {
                    if (reg.$dd) this.destroyActionbar(reg)
                    else this.createActionbar({reg, $menu, $name, $container})
                    return false
                })
                .hoverIntent({
                    interval: 200,
                    over: () => {this.createActionbar({reg, $menu, $name, $container})}
                })

            material.button({
                appendTo: $name,
                label: material.icon('keyboard_arrow_down'),
                icon: true
            })
                .css({position: 'absolute', bottom: 0, left: 0})
                .on('click', () => {
                    $name.toggleClass('vx-is-collapsed')
                    this.syncRegionData()
                    return false
                })
                .addClass('vx-waveform-region__descr-toggle').hide()
        }

        this.setRegionData(reg)
        this.syncRegionData()
    }
    _onRegionUpdateEnd = (reg) => {
        const oldName = reg.data.name
        const oldRange = reg.data.range
        reg.start = Math.round(reg.start)
        reg.end = Math.round(reg.end)
        // reg.start = Math.floor(reg.start)
        // reg.end = Math.ceil(reg.end)
        reg.data.range = _formatTime(reg.start, reg.end)
        reg.data.name = reg.data.name || reg.data.range
        if (reg.data.name === oldRange) reg.data.name = reg.data.range
        this.setRegionData(reg)
        this.syncRegionData()
        this.updateRegion(reg, oldName)
    }
    _onRegionRemoved = (reg) => {
        this.removeRegion(reg.id)
    }
    _onRegionPlay = (reg) => {
        const btns: any = this.getButtons(reg)
        if (!btns) return

        btns.pause.enable()
        btns.stop.enable()
        btns.replay.enable()
        btns.forward.enable()
    }
    _onPause = (reg) => {
        reg = reg || this.playingRegion
        const btns: any = this.getButtons(reg)
        if (!btns) return

        btns.pause.disable()
        btns.replay.disable()
        btns.forward.disable()
    }
    _onStop = (reg) => {
        reg = reg || this.playingRegion
        const btns: any = this.getButtons(reg)
        if (!btns) return

        btns.pause.disable()
        btns.stop.disable()
        btns.replay.disable()
        btns.forward.disable()
    }
    // NOTE use own skip method cause wavesurfer.skip pause and replay
    _skip = (offset) => {
        const duration = this.wavesurfer.getDuration() || 1
        let position = this.wavesurfer.getCurrentTime() || 0
        position = Math.max(0, Math.min(duration, position + (offset || 0)))
        const progress = position / duration
        this.wavesurfer.backend.seekTo(position)
        this.wavesurfer.drawer.progress(progress)
    }

    getRegions() {
        return _.get(this.wavesurfer, 'regions.list', {})
    }
    getRegion(id) {
        return this.getRegions()[id]
    }
    getRegionByIndex = (tidx) => {
        return _.filter(this.getRegions(), reg => reg.data.tidx === tidx)
    }
    getRegionDataElement(id) {
        return this.$container.find(`[data-regid="${id}"]`)
    }
    getRegionDataChildElements(id) {
        return $(this.container).find(`[data-regid-child="${id}"]`)
    }
    getSortedRegions() {
        return _.sortBy(this.getRegions(), reg => reg.start)
    }
    getFilterRegions() {
        return _.filter(this.getRegions(), reg => reg.data.editable !== false)
    }

    buildRegionData(data) {
        const {start, end, resize = true, name, descr, editable} = data
        const color = data.color || this.params.color_region
        return {
            start: start / 1000,
            end: end / 1000,
            color,
            loop: false,
            resize,
            drag: true,
            data: {
                editable,
                name,
                descr,
                color
            }
        }
    }
    setRegionData(reg) {
        const name = (reg.data.name || '').trim()
        const descr = (reg.data.descr || '').trim()
        const $regd = this.getRegionDataElement(reg.id)
        const color = new (window as any).Colors({color: reg.color})

        reg.data.range = reg.data.range || _formatTime(reg.start, reg.end)
        // $regd.next().next().find('.vx-waveform-region-side__range').text(reg.data.range)
        $regd
            .css({backgroundColor: `#${color.colors.HEX}`})
            .find('.vxtr-region-data').text(name)
            .end()
            .find('.vxtr-region-descr').html(descr)

        // check length of description
        // set initial collapsed state
        // and show toggle button
        const $descr = $regd.find('.vxtr-region-descr')
        if ($descr.height() as number > 20) {
            $regd.addClass('vx-is-collapsed')
            $regd.find('.vx-waveform-region__descr-toggle').show()
        }
    }
    getRegionData(reg) {
        return {
            ...reg.data,
            ...{
                start: reg.start * 1000,
                end: reg.end * 1000,
                color: reg.color
            }
        }
    }
    syncRegionData = () => {
        if (!this.isReady) return
        const $container = $(this.container)
        if (!$container.width()) return

        let top = 0
        _.defer(() => {
            _.each(this.getSortedRegions(), (reg, i) => {
                const $reg = $(reg.element).height(this.params.canEdit ? '50%' : '100%')
                const left = $reg.css('left')
                const width = $reg.width() as number || 3
                const $regd = this.getRegionDataElement(reg.id).css({
                    top,
                    left,
                    width: 'auto',
                    minWidth: width,
                    height: 'auto',
                    zIndex: i + 10
                })
                // console.log('background', $regd.css('backgroundColor'))
                if (parseInt($regd.css('right'), 10) < 0) $regd.css('right', 0)
                // TODO use selectors instead of next()
                $regd.next().next().css({top})
                top += $regd.outerHeight(true) as number
                // TODO use selectors instead of next()
                $regd.next().css({top, left}).width(width - 2)
            })
            $container.height(top)
        })
    }

    removeRegion(id: string) {
        this.getRegionDataElement(id).remove()
        this.getRegionDataChildElements(id).remove()
        this.syncRegionData()
        const region = this.getRegion(id)
        if (region) {
            if (region.$dd) region.$dd.remove()
            region.$dd = null
            const regdata = this.getRegionData(region)
            region.remove()
            const i18n = _.get(window, 'Voixen.i18n', _.noop)
            const _snackbar = _.get(window, 'Voixen._snackbar', _.noop)
            const snackbar = _.get(window, 'Voixen.snackbar', _.noop)
            snackbar({
                type: 'success',
                message: i18n('player.removeregion'),
                timeout: 8000,
                actionText: i18n('undo'),
                actionHandler: () => {
                    if (_snackbar) _snackbar.hideSnackbar()
                    const reg = this.wavesurfer.addRegion(this.buildRegionData(regdata))
                    this.addRegion(reg)
                }
            })
            this.deleteRegion(region.data.name)
        }
    }

    editRegion(reg) {
        const wid = this.params.wid
        const oldName = reg.data.name
        let $tfn, $tfd, $tfc
        const material = (window as any).material
        const $dlg = material.prompt({
            title: i18n('player.editregion'),
            agree: i18n('forms.apply'),
            agreeDisabled: true,
            disagree: i18n('forms.cancel'),
            content() {
                const $c = $('<div/>')
                $('<small class="vx-recording__edit-range"/>').text(reg.data.range).appendTo($c)
                $tfn = material.textfield({
                    appendTo: $c,
                    label: i18n('player.region.name'),
                    value: reg.data.name,
                    width: '100%',
                    required: true,
                    autofocus: true,
                    maxlength: 40,
                    helper: 'max. 40',
                    on: {
                        value(name) {
                            if (!$dlg) return

                            const btnAgree = $dlg.find('[data-name=agree]')[0].MaterialButton
                            name = name.trim()
                            if (name === reg.data.name) {
                                btnAgree.enable()
                            }
                            else if (!name) {
                                $tfn.find('.mdl-textfield__error').text('Name is required!')
                                $tfn.addClass('is-invalid')
                                btnAgree.disable()
                            }
                            else {
                                const payload = {id: wid, name}
                                const dispatch = _.get(window, 'Voixen.STORE.dispatch')
                                dispatch(ATYPES.IS_UNIQUE_TAG, payload).then(isUniq => {
                                    if (!isUniq) {
                                        $tfn.find('.mdl-textfield__error').text('Name already exists!')
                                        $tfn.addClass('is-invalid')
                                        btnAgree.disable()
                                    }
                                    else {
                                        $tfn.find('.mdl-textfield__error').text('')
                                        $tfn.removeClass('is-invalid')
                                        btnAgree.enable()
                                    }
                                })
                            }
                        }
                    }
                })
                $tfd = material.textfield({
                    appendTo: $c,
                    label: i18n('player.region.descr'),
                    value: reg.data.descr,
                    width: '100%',
                    rows: 5,
                    maxlength: 256,
                    resize: false
                })
                // input[type=color] needs HEX color
                const color = new (window as any).Colors({color: reg.color})
                $tfc = material.textfield({
                    appendTo: $c,
                    label: i18n('backgroundcolor'),
                    value: '#' + color.colors.HEX,
                    width: '48px',
                    clear: false
                }).css({overflow: 'visible'})
                $tfc.find('.mdl-textfield__input').attr('type', 'color').height(48)
                $tfc.find('.mdl-textfield__label').css({overflow: 'visible'})
                _.defer(() => {
                    $tfn.find('.mdl-textfield__input').trigger('change')
                    // $tfd.find('.mdl-textfield__input').trigger('change')
                })
                return $c
            }
        }, apply => {
            if (!apply) return

            reg.data.name = $tfn[0].MaterialTextfield.input_.value
            reg.data.descr = $tfd[0].MaterialTextfield.input_.value

            // calculate color with alpha from newColor
            // type="color" return simple hex value
            // but we need opacity to see the wave
            const newColor = $tfc[0].MaterialTextfield.input_.value
            reg.color = this.getRegionColor(newColor)
            $(reg.element).css({ backgroundColor: reg.color })

            this.setRegionData(reg)
            this.updateRegion(reg, oldName)
        })
    }
    playRegion(reg) {
        const {lazyPlay} = this.wavesurfer
        this.stopRegion(this.playingRegion)
        _.isFunction(lazyPlay) ? lazyPlay(reg) : reg.play()
        this.playingRegion = reg
    }
    stopRegion(reg) {
        this.wavesurfer.pause()
        this._onStop(reg)
        if (reg) this.wavesurfer.setCurrentTime(reg.start)
    }

    // ## sync region data to recording.extended_tags
    addRegion(reg) {
        const tag = {
            tag_text: reg.data.name,
            time_start_offset: reg.start * 1000,
            time_end_offset: reg.end * 1000,
            color: this.getTagColor(reg.color),
            descr: reg.data.descr
        }
        const dispatch = _.get(window, 'Voixen.STORE.dispatch')
        dispatch(ATYPES.ADD_TAG, {id: this.params.wid, tag})
    }
    updateRegion(reg, oldName) {
        // TODO check if new name is unique
        this.deleteRegion(oldName).then(() => {
            this.addRegion(reg)
        })
    }
    deleteRegion(tag) {
        const dispatch = _.get(window, 'Voixen.STORE.dispatch')
        return dispatch(ATYPES.DELETE_TAG, {id: this.params.wid, tag})
    }

    /**
     * Remove all regions
     */
    clear() {
        // Object.keys(this.list).forEach(id => {
        //     this.list[id].remove()
        // })
    }

    createActionbar(params) {
        const {reg, $menu, $name, $container} = params
        if (reg.$dd) return // menu already exists

        const material = (window as any).material
        const items: any[] = [
            {value: 'play', label: material.icon('play_circle_outline'), icon: true, stay: true},
            {value: 'pause', label: material.icon('pause'), icon: true, disabled: true, stay: true},
            {value: 'stop', label: material.icon('stop_circle_outline'), icon: true, disabled: true, stay: true},
            {value: 'replay', label: material.icon('replay_5'), icon: true, disabled: true, stay: true},
            {value: 'forward', label: material.icon('forward_5'), icon: true, disabled: true, stay: true}
        ]
        if (this.params.filterable && reg.data.filterable !== false) {
            items.push({value: 'filter', label: material.icon('filter_list'), icon: true, disabled: false, stay: true})
        }
        if (this.params.canEdit && reg.data.editable) {
            items.push({value: 'edit', label: material.icon('edit'), icon: true})
            items.push({value: 'delete', label: material.icon('delete'), icon: true})
        }
        if (this.params.canEdit && reg.data.saveable) {
            items.push({value: 'save', label: material.icon('save'), icon: true})
        }

        reg.$dd = material.dropdown({
            appendTo: $container,
            element: $menu[0],
            cls: 'vx-waveform-region__actions',
            offsetY: 2,
            offsetX: 1,
            items,
            on: {
                click: (item) => {
                    if (_.isFunction(this.params.onRegion)) this.params.onRegion.call(this, item.value, reg)
                    switch (item.value) {
                        case 'play': this.playRegion(reg); break
                        case 'pause': this.wavesurfer.pause(); break
                        case 'stop': this.stopRegion(reg); break
                        case 'replay': this._skip(-5); break
                        case 'forward': this._skip(5); break
                        case 'edit': this.editRegion(reg); break
                        case 'delete': this.removeRegion(reg.id); break
                        case 'save': this.addRegion(reg); break
                    }
                },
                close: () => {this.destroyActionbar(reg)},
                pos: () => {
                    const nheight = $name.outerHeight(true) || 20
                    const ntop = parseInt($name.css('top'), 10)
                    const nleft = $name.css('left')
                    return {top: ntop + nheight, left: nleft}
                }
            }
        })
    }
    destroyActionbar(reg) {
        reg = reg || this.playingRegion
        if (reg.$dd) reg.$dd.remove()
        reg.$dd = null
    }
    getButtons(reg) {
        if (!reg || !reg.$dd) return

        const btns = {}
        reg.$dd.find('li[data-val]').each((i, el) => {
            const val = el.getAttribute('data-val')
            btns[val] = $(el).find('.mdl-button').get(0).MaterialButton
        })
        return btns
    }

    private getTagColor(colorCode) {
        const color = new (window as any).Colors({color: colorCode})
        color.colors.alpha = 1
        return color.toString()
    }
    private getRegionColor(colorCode) {
        const color = new (window as any).Colors({color: colorCode})
        color.colors.alpha = this.params.alpha_region
        return color.toString()
    }
}
