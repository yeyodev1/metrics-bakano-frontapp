import { bind, play } from 'cuelume'

/**
 * Global interaction sound.
 *
 * Cuelume triggers on `data-cuelume-*` attributes. Rather than annotating every
 * button across the app by hand, interactive elements are annotated
 * automatically and a MutationObserver keeps up with anything rendered later.
 *
 * Opt out of a single element (or a whole subtree) with `data-no-sound`.
 */

/** Clicked things that should feel like a real two-part press. */
const PRESSABLE = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  'summary',
  'select',
].join(',')

/** Things that flip between two states. */
const TOGGLEABLE = [
  'input[type="checkbox"]',
  'input[type="radio"]',
  '[role="switch"]',
].join(',')

/**
 * Navigation gets a soft cue on hover too, so moving through the sidebar is
 * audible before anything is clicked. Cuelume throttles hover globally to one
 * every 150ms, so sweeping the menu stays quiet.
 */
const HOVERABLE = ['a[href]', '[role="tab"]', '[role="menuitem"]'].join(',')

const ANNOTATED = 'data-cuelume-bound'

function annotate(el: Element) {
  if (!(el instanceof HTMLElement)) return
  if (el.hasAttribute(ANNOTATED)) return
  // Respect an opt-out anywhere up the tree.
  if (el.closest('[data-no-sound]')) return

  if (el.matches(TOGGLEABLE)) {
    el.setAttribute('data-cuelume-toggle', '')
  } else if (el.matches(PRESSABLE)) {
    el.setAttribute('data-cuelume-press', '')
    el.setAttribute('data-cuelume-release', '')
    if (el.matches(HOVERABLE)) el.setAttribute('data-cuelume-hover', 'tick')
  } else {
    return
  }

  el.setAttribute(ANNOTATED, '')
}

function annotateTree(root: ParentNode) {
  if (root instanceof Element) annotate(root)
  root.querySelectorAll(`${PRESSABLE},${TOGGLEABLE}`).forEach(annotate)
}

let observer: MutationObserver | null = null

/**
 * Browsers refuse to start audio until the user has interacted with the page,
 * and that first gesture is usually swallowed. Playing one cue on it makes the
 * very first click audible instead of silent.
 */
function primeAudioOnFirstGesture() {
  const wake = () => {
    try {
      play('whisper', { volume: 0.15 })
    } catch {
      /* ignored */
    }
  }
  window.addEventListener('pointerdown', wake, { once: true, capture: true })
  window.addEventListener('keydown', wake, { once: true, capture: true })
}

export function initSound(root: ParentNode = document) {
  annotateTree(root)
  // Delegated at the document level, and idempotent, so one call is enough.
  bind()
  primeAudioOnFirstGesture()

  observer?.disconnect()
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) annotateTree(node as Element)
      })
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

export function stopSound() {
  observer?.disconnect()
  observer = null
}
