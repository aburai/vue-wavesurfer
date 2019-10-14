/**
 * Singleton Class to handle localStorage
 */
import _ from 'lodash'
class Store {
  get(key, def) {
    if (!key) return

    let data = window.localStorage.getItem(key)
    if (!data) data = def

    return typeof data === 'string' ? JSON.parse(data) : data
  }
  set(key, value) {
    if (!key) return

    let data = value
    if (typeof data === 'object') data = JSON.stringify(data)
    window.localStorage.setItem(key, data)
  }
  update(key, value) {
    if (!key) return

    const current = this.get(key)
    this.set(key, _.extend(current, value))
  }
}
const store = new Store()
export default store
