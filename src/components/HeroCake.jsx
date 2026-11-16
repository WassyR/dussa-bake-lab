import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { HERO_PHOTO } from '../data/photography'
import { useTheme } from '../context/ThemeContext'

// Official privacy-enhanced embed. This is inspiration footage from YouTube,
// not video recorded in Dussa BakeLab's kitchen.
const VIDEO_ID = 'HTXB6flODww'
const PLAYER_ORIGIN = 'https://www.youtube-nocookie.com'

/* YouTube player states, as reported over postMessage. */
const ENDED = 0
const PLAYING = 1
const BUFFERING = 3

/*
 * The part of the film we loop, in seconds. This is Ira Bakes' marketing film
 * (shot by Säynevirta Photography) and from about 38s it carries a large
 * "IRA BAKES" logo — another bakery's brand, which must never play on Dussa's
 * homepage. So each loop stops at FILM_END, fades back to the still, and
 * rewinds to FILM_START: the flour falling through the sieve, which also
 * frames well on a phone. The source opens on a wider shot that a phone
 * crops to bare wall.
 */
const FILM_START = 3.5
const FILM_END = 37
const FADE_OUT_AT = FILM_END - 1.8 // the fade takes 1.6s; finish it before the cut

function embedUrl() {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    playsinline: '1',
    controls: '0',
    loop: '1',
    playlist: VIDEO_ID,
    rel: '0',
    // Belt and braces for the loop window enforced below.
    start: String(Math.floor(FILM_START)),
    end: String(FILM_END),
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    modestbranding: '1',
    // Lets the player tell us when the film is genuinely playing.
    enablejsapi: '1',
    origin: window.location.origin,
  })
  return `${PLAYER_ORIGIN}/embed/${VIDEO_ID}?${params}`
}

/**
 * Should the film start by itself on this visit? On every screen size —
 * phones included — unless the visitor has asked for less motion or less
 * data, or is on a connection too slow to stream it.
 */
function canAutoplay(reducedMotion) {
  // Always try, on every connection. Only a visitor who has asked their
  // device for less motion is left on the still.
  return !reducedMotion
}

/**
 * The homepage film.
 *
 * The footage is cinemascope, about 2.39:1, sitting inside YouTube's 16:9
 * player with black bars above and below. The CSS (.hero-film-frame) sizes the
 * player so its *picture* covers the frame, which pushes the bars — and
 * YouTube's own title strip and logo with them — outside it.
 *
 * YouTube's iframe "loads" long before anything plays, so the still is shown
 * first, the player is fetched once the page has settled, and it is faded in
 * only when YouTube itself reports PLAYING. Between loops, when paused, or
 * when scrolled away it fades back to the still.
 *
 * When a phone refuses to autoplay — iPhone Low Power Mode, Android data
 * saver, the Instagram and Facebook in-app browsers — a button on *our* page
 * cannot start it either: the tap happens outside YouTube's frame, and the
 * browser only lets a tap inside the frame start playback. So in that case the
 * player itself is shown and made tappable, with a hint, and the first tap on
 * it starts the film.
 *
 * Shares one play/pause control between the mobile overlay and the hero's
 * desktop layout through `children({ controls })`.
 */
export default function HeroCake({ children }) {
  const reducedMotion = useReducedMotion()
  const { isBright } = useTheme()
  const layerRef = useRef(null)
  const frameRef = useRef(null)

  const [mounted, setMounted] = useState(false)
  const [wanted, setWanted] = useState(false)
  const [showing, setShowing] = useState(false)
  const [needsTap, setNeedsTap] = useState(false)

  const talking = useRef(false) // the player has answered us at least once
  const everPlayed = useRef(false)
  const lastState = useRef(null)
  const rewinding = useRef(false)
  const userPaused = useRef(false)
  const timers = useRef([])

  const src = useMemo(() => (mounted ? embedUrl() : ''), [mounted])

  // Read inside the message handler without re-subscribing it.
  const needsTapRef = useRef(false)
  useEffect(() => {
    needsTapRef.current = needsTap
  }, [needsTap])

  const later = (fn, ms) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const send = useCallback((payload) => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ id: 'dussa-hero', channel: 'widget', ...payload }),
      PLAYER_ORIGIN,
    )
  }, [])

  const startPlayback = useCallback(() => {
    if (userPaused.current) return
    // Some players finish loading without honouring the URL's autoplay flag.
    // Muting before playVideo also satisfies browsers' muted-autoplay policy.
    send({ event: 'command', func: 'mute', args: [] })
    send({ event: 'command', func: 'playVideo', args: [] })
  }, [send])

  const askForTap = useCallback(() => {
    if (userPaused.current) return
    setNeedsTap(true)
    setShowing(true)
    setWanted(false)
  }, [])

  /* ------------------------------------------------------ autoplay */
  useEffect(() => {
    if (!canAutoplay(reducedMotion)) return undefined

    // Wait for the page to settle: the headline and the still should never
    // queue behind a video player's scripts.
    const begin = () => {
      setWanted(true)
      setMounted(true)
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(begin, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(begin, 700)
    return () => window.clearTimeout(id)
  }, [reducedMotion])

  /* ------------------------------------------- what the player says */
  useEffect(() => {
    if (!mounted) return undefined

    const onMessage = (event) => {
      if (event.origin !== PLAYER_ORIGIN) return
      if (event.source !== frameRef.current?.contentWindow) return

      let data
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      talking.current = true

      if (data?.event === 'onReady') {
        // Register after the player is ready; commands sent while the iframe
        // is still initialising can be ignored by YouTube.
        for (const event of ['onStateChange', 'onAutoplayBlocked']) {
          send({ event: 'command', func: 'addEventListener', args: [event] })
        }
        startPlayback()
        return
      }
      if (data?.event === 'onAutoplayBlocked') {
        askForTap()
        return
      }

      // Keep the loop inside the window: fade out before FILM_END, rewind at it.
      const time = data?.info?.currentTime
      if (typeof time === 'number') {
        if (time >= FILM_END - 0.25 && !rewinding.current) {
          rewinding.current = true
          setShowing(false)
          send({ event: 'command', func: 'seekTo', args: [FILM_START, true] })
          // Never leave the flag set: a player that stops reporting the time
          // would otherwise keep the film hidden for good.
          later(() => {
            if (!rewinding.current) return
            rewinding.current = false
            if (lastState.current === PLAYING) setShowing(true)
          }, 1500)
        } else if (time >= FADE_OUT_AT && !needsTapRef.current) {
          setShowing(false)
        } else if (rewinding.current && time < FADE_OUT_AT - 1) {
          rewinding.current = false
          if (lastState.current === PLAYING) setShowing(true)
        }
      }

      const state = data?.event === 'onStateChange' ? data.info : data?.info?.playerState
      if (typeof state !== 'number') return
      lastState.current = state

      // If the player stops at its own end marker instead, restart the window
      // ourselves rather than relying on YouTube's loop to respect it.
      if (state === ENDED && !userPaused.current) {
        send({ event: 'command', func: 'seekTo', args: [FILM_START, true] })
        send({ event: 'command', func: 'playVideo', args: [] })
      }

      if (state === PLAYING) {
        everPlayed.current = true
        setNeedsTap(false)
        setWanted(true)
        userPaused.current = false
      }
      // Mid-film buffering holds the last frame, which is fine to keep on
      // screen. Anything else — ended, paused, cued — goes back to the still,
      // except while we are waiting for a tap, when the player must stay put.
      if (state === BUFFERING) rewinding.current = false
      setShowing((current) => {
        if (state === PLAYING) return !rewinding.current
        if (state === BUFFERING) return current
        return current && needsTapRef.current
      })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [mounted, send, startPlayback, askForTap])

  const onFrameLoad = () => {
    // The player's API is not always ready the instant its page loads, so ask
    // a few times until it answers.
    let tries = 0
    const ask = () => {
      if (talking.current || tries >= 25) return
      tries += 1
      send({ event: 'listening' })
      send({ event: 'command', func: 'addEventListener', args: ['onStateChange'] })
      later(ask, 400)
    }
    ask()

    // Retry a player that returns to UNSTARTED/CUED after loading. Stop once
    // playback begins or the visitor pauses; buffering gets time to finish.
    const retryStart = (attempt) => {
      if (everPlayed.current || userPaused.current || needsTapRef.current) return
      if (talking.current && lastState.current !== BUFFERING) startPlayback()
      if (attempt < 5) later(() => retryStart(attempt + 1), 1500)
    }
    later(() => retryStart(0), 1000)

    // A player that never answers at all (an extension eating postMessage, a
    // changed API) should not mean a film that never appears: show it, and
    // let it be tapped in case it is sitting there unplayed.
    later(() => {
      if (!talking.current && !userPaused.current) askForTap()
    }, 6000)

    // One that answers but has not reached PLAYING by now was refused
    // autoplay — unless it is still buffering on a slow connection, in which
    // case keep waiting a while longer before deciding.
    const decide = (attempt) => {
      if (!talking.current || everPlayed.current || userPaused.current) return
      if (lastState.current === BUFFERING && attempt < 5) {
        later(() => decide(attempt + 1), 3000)
        return
      }
      askForTap()
    }
    later(() => decide(0), 7000)
  }

  /* ----------------------------------- pause when scrolled out of view */
  useEffect(() => {
    if (!mounted || !('IntersectionObserver' in window)) return undefined
    const layer = layerRef.current
    if (!layer) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!talking.current || userPaused.current || !everPlayed.current) return
        send({ event: 'command', func: entry.isIntersecting ? 'playVideo' : 'pauseVideo', args: [] })
      },
      { threshold: 0.15 },
    )
    observer.observe(layer)
    return () => observer.disconnect()
  }, [mounted, send])

  /* ------------------------------------------------------- the button */
  const toggle = () => {
    if (wanted) {
      userPaused.current = true
      setWanted(false)
      setShowing(false)
      if (talking.current) send({ event: 'command', func: 'pauseVideo', args: [] })
      else setMounted(false) // cannot pause a player that will not listen; unload it
      return
    }

    userPaused.current = false
    setWanted(true)
    if (mounted && talking.current) {
      startPlayback()
    } else {
      setMounted(true)
    }
  }

  const label = wanted ? 'Pause the background film' : 'Play the background film'
  const icon = wanted ? (
    <Pause size={11} fill="currentColor" strokeWidth={1.4} aria-hidden="true" />
  ) : (
    <Play size={11} fill="currentColor" strokeWidth={1.4} className="translate-x-px" aria-hidden="true" />
  )

  // A shared control keeps the same appearance and touch target at every size.
  const controls = (
    <div className="pointer-events-none inline-flex items-center gap-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={wanted}
        aria-label={label}
        title={wanted ? 'Pause background video' : 'Play background video'}
        className={`film-control ${isBright ? 'film-control--light' : ''}`}
      >
        <span className="film-control__icon">
          {icon}
        </span>
        <span className="film-control__label">{wanted ? 'Pause' : 'Play'}</span>
      </button>
      {needsTap && (
        <span className={`max-w-28 text-[0.65rem] leading-snug ${isBright ? 'text-[#52331f]' : 'text-white/90'}`}>
          Tap the film to play
        </span>
      )}
    </div>
  )

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#1a0e09]">
        <img
          src={HERO_PHOTO.src}
          srcSet={HERO_PHOTO.srcSet}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="hero-still absolute inset-0 h-full w-full object-cover object-[55%_35%]"
        />

        <div ref={layerRef} className="hero-film-layer">
          {mounted && (
            <iframe
              ref={frameRef}
              title="Background film: baking inspiration from YouTube"
              src={src}
              // Out of the tab order while it is decoration; reachable when it
              // is the only way to start the film.
              tabIndex={needsTap ? 0 : -1}
              aria-hidden={needsTap ? undefined : 'true'}
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={onFrameLoad}
              className={`hero-film-frame ${showing ? 'is-showing' : ''} ${needsTap ? 'is-tappable' : ''}`}
            />
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-24 z-20 md:hidden">
        {controls}
      </div>

      {typeof children === 'function' ? children({ controls, needsTap }) : children}
    </>
  )
}
