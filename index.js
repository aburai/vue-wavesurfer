import VWavesurfer from './components/v-wavesurfer'

// This is your plugin object. It can be exported to be used anywhere.
const VueWavesurfer = {
  // The install method is all that needs to exist on the plugin object.
  // It takes the global Vue object as well as user-defined options.
  install(Vue, options = {}) {
    Vue.component(VWavesurfer.name, VWavesurfer)

    // Object containing Wavesurfer objects
    Vue.prototype.$wavesurfer = {}
  }
}

export default VueWavesurfer

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VueWavesurfer)
}
