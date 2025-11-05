import { useState, useEffect, useCallback } from 'react'

export interface MediaDevice {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

export interface UseMediaDevicesReturn {
  devices: MediaDevice[]
  videoDevices: MediaDevice[]
  audioDevices: MediaDevice[]
  selectedVideoDevice: string
  selectedAudioDevice: string
  isLoading: boolean
  error: string | null
  refreshDevices: () => Promise<void>
  selectVideoDevice: (deviceId: string) => void
  selectAudioDevice: (deviceId: string) => void
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [devices, setDevices] = useState<MediaDevice[]>([])
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshDevices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      }).then(stream => {
        // Stop all tracks to release the devices
        stream.getTracks().forEach(track => track.stop())
      })

      // Get device list
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      
      const formattedDevices: MediaDevice[] = deviceList
        .filter(device => device.kind === 'videoinput' || device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `${device.kind === 'videoinput' ? 'Camera' : 'Microphone'} ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }))

      setDevices(formattedDevices)

      // Set default devices if not already selected
      if (!selectedVideoDevice) {
        const defaultVideo = formattedDevices.find(d => d.kind === 'videoinput')
        if (defaultVideo) {
          setSelectedVideoDevice(defaultVideo.deviceId)
        }
      }

      if (!selectedAudioDevice) {
        const defaultAudio = formattedDevices.find(d => d.kind === 'audioinput')
        if (defaultAudio) {
          setSelectedAudioDevice(defaultAudio.deviceId)
        }
      }

    } catch (err) {
      console.error('Error accessing media devices:', err)
      setError(err instanceof Error ? err.message : 'Failed to access media devices')
    } finally {
      setIsLoading(false)
    }
  }, [selectedVideoDevice, selectedAudioDevice])

  useEffect(() => {
    refreshDevices()

    // Listen for device changes
    const handleDeviceChange = () => {
      refreshDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [refreshDevices])

  const selectVideoDevice = useCallback((deviceId: string) => {
    setSelectedVideoDevice(deviceId)
  }, [])

  const selectAudioDevice = useCallback((deviceId: string) => {
    setSelectedAudioDevice(deviceId)
  }, [])

  const videoDevices = devices.filter(device => device.kind === 'videoinput')
  const audioDevices = devices.filter(device => device.kind === 'audioinput')

  return {
    devices,
    videoDevices,
    audioDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    isLoading,
    error,
    refreshDevices,
    selectVideoDevice,
    selectAudioDevice
  }
}
