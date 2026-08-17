import { compareVersions } from 'compare-versions'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import { remoteConfigAtom } from '@/stores/atoms'
import { CHATBOX_BUILD_CHANNEL, CHATBOX_BUILD_PLATFORM } from '@/variables'
import platform from '../platform'

function getInitialTime() {
  let initialTime = parseInt(localStorage.getItem('initial-time') || '')
  if (!initialTime) {
    initialTime = Date.now()
    localStorage.setItem('initial-time', `${initialTime}`)
  }

  return initialTime
}

export function isFirstDay(): boolean {
  const initialTime = getInitialTime()
  const today = dayjs()
  const installDay = dayjs(initialTime)

  // Compare only the date part (year, month, day) in user's local timezone
  // This ensures the comparison is based on the user's current timezone,
  // which is more intuitive for the user experience
  return today.isSame(installDay, 'day')
}

export default function useVersion() {
  const remoteConfig = useAtomValue(remoteConfigAtom)
  const [version, _setVersion] = useState('')
  const isStoreReviewPlatform =
    CHATBOX_BUILD_PLATFORM === 'ios' ||
    (CHATBOX_BUILD_PLATFORM === 'android' && CHATBOX_BUILD_CHANNEL === 'google_play')
  const isExceeded = useMemo(
    () =>
      isStoreReviewPlatform &&
      Date.now() - getInitialTime() < 24 * 3600 * 1000 &&
      version &&
      remoteConfig.current_version &&
      compareVersions(version, remoteConfig.current_version) === 1,
    [version, remoteConfig]
  )
  useEffect(() => {
    void platform.getVersion().then(_setVersion)
  }, [])

  // True when all async data needed to evaluate isExceeded has loaded.
  // On non-store platforms this is always true (no defense to evaluate).
  // On store platforms we must wait for both version AND remoteConfig.current_version
  // before the guide-navigation guard in __root.tsx can make a reliable decision.
  const isExceededResolved = isStoreReviewPlatform ? !!(version && remoteConfig.current_version) : true

  return {
    version,
    versionLoaded: !!version,
    isExceeded,
    isExceededResolved,
    needCheckUpdate: false,
  }
}
