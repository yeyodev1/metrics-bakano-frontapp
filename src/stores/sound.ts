import { defineStore } from 'pinia'
import { setEnabled, setVolume } from 'cuelume'

/**
 * UI sound preferences.
 *
 * Cuelume applies the setting but never persists it, so the store owns it.
 * Follows the same one-key-per-field localStorage pattern as `useUserStore`.
 */
const KEY_ENABLED = 'ui_sound_enabled'
const KEY_VOLUME = 'ui_sound_volume'
const KEY_MIGRATION = 'ui_sound_migration'

/**
 * Everyone gets sound, on, out of the box — present but not intrusive.
 * Nothing is written to storage until the user changes something, so the
 * default keeps applying until they explicitly opt out or turn it down.
 */
const DEFAULT_ENABLED = true
const DEFAULT_VOLUME = 0.25

/**
 * An earlier build silently muted the app when the OS had "reduce motion" on,
 * and persisted that choice. This clears that stale value once so nobody stays
 * muted by a decision they never made.
 */
const CURRENT_MIGRATION = '2'

export const useSoundStore = defineStore('sound', {
  state: () => ({
    enabled: DEFAULT_ENABLED,
    volume: DEFAULT_VOLUME,
    hydrated: false,
  }),

  getters: {
    /** True while the user has never expressed a preference. */
    isDefault: () =>
      localStorage.getItem(KEY_ENABLED) === null &&
      localStorage.getItem(KEY_VOLUME) === null,
  },

  actions: {
    /** Restore from localStorage and push the values into cuelume. */
    hydrate() {
      if (localStorage.getItem(KEY_MIGRATION) !== CURRENT_MIGRATION) {
        localStorage.removeItem(KEY_ENABLED)
        localStorage.removeItem(KEY_VOLUME)
        localStorage.setItem(KEY_MIGRATION, CURRENT_MIGRATION)
      }

      const storedEnabled = localStorage.getItem(KEY_ENABLED)
      // Only an explicit stored 'false' turns it off; anything else is default.
      this.enabled = storedEnabled === null ? DEFAULT_ENABLED : storedEnabled === 'true'

      // `Number(null)` is 0, which passes every range check — that silently
      // pinned the volume to zero whenever nothing was stored yet.
      const rawVolume = localStorage.getItem(KEY_VOLUME)
      const parsedVolume = Number(rawVolume)
      // A stored 0 is a real choice and is kept; a *missing* key is not.
      this.volume =
        rawVolume !== null && Number.isFinite(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1
          ? parsedVolume
          : DEFAULT_VOLUME

      this.apply()
      this.hydrated = true
    },

    apply() {
      setEnabled(this.enabled)
      setVolume(this.volume)
    },

    setEnabled(enabled: boolean) {
      this.enabled = enabled
      localStorage.setItem(KEY_ENABLED, String(enabled))
      setEnabled(enabled)
    },

    toggle() {
      this.setEnabled(!this.enabled)
    },

    /** Forget the user's choice and fall back to the shipped default. */
    resetToDefault() {
      localStorage.removeItem(KEY_ENABLED)
      localStorage.removeItem(KEY_VOLUME)
      this.enabled = DEFAULT_ENABLED
      this.volume = DEFAULT_VOLUME
      this.apply()
    },

    setVolume(volume: number) {
      const clamped = Math.min(1, Math.max(0, Number(volume) || 0))
      this.volume = clamped
      localStorage.setItem(KEY_VOLUME, String(clamped))
      setVolume(clamped)
    },
  },
})
