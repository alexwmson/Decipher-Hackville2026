import { useEffect, useRef, useState } from 'react'

function ImageSourcePicker({ disabled = false, onPick, stackButtons = false }) {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState('')

  // When the camera UI mounts, attach the stream to the <video>.
  // (On first open, the stream is created before the <video> exists.)
  useEffect(() => {
    const videoEl = videoRef.current
    if (!showCamera || !stream || !videoEl) return

    videoEl.srcObject = stream
    const playPromise = videoEl.play?.()
    if (playPromise?.catch) {
      playPromise.catch(() => {
        // If autoplay is blocked, the user can still tap Capture after the video starts;
        // leaving this silent avoids noisy errors.
      })
    }
  }, [showCamera, stream])

  const stopCamera = () => {
    if (videoRef.current) videoRef.current.srcObject = null
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const startCamera = async () => {
    setError('')
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Camera not supported in this browser')
        return
      }

      const preferred = {
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      }

      let mediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(preferred)
      } catch (_e) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      setStream(mediaStream)
      setShowCamera(true)
    } catch (err) {
      const name = err?.name || 'Error'
      if (name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.')
        return
      }
      if (name === 'NotFoundError') {
        setError('No camera device found.')
        return
      }
      setError(`Failed to access camera (${name}).`)
    }
  }

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    // If the stream hasn't started rendering yet, dimensions will be 0 and
    // the captured image will be blank/black.
    if (!video.videoWidth || !video.videoHeight) {
      setError('Camera not ready yet — please wait a moment and try Capture again.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return
      stopCamera()
      onPick?.(blob)
    }, 'image/jpeg', 0.9)
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    setError('')
    onPick?.(file)
  }

  const pickButtonsLayoutClass = stackButtons ? 'grid-cols-1' : 'grid-cols-2'

  return (
    <div className="space-y-3">
      {!showCamera ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          <div className={`grid ${pickButtonsLayoutClass} gap-3`}>
            <button
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white/90 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-semibold">Upload image</div>
              <div className="text-xs text-white/60">PNG/JPG/PDF photo</div>
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl group-hover:bg-cyan-300/25 transition" />
            </button>

            <button
              disabled={disabled}
              onClick={startCamera}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white/90 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-semibold">Take photo</div>
              <div className="text-xs text-white/60">Use your camera</div>
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl group-hover:bg-fuchsia-300/25 transition" />
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-xl border border-white/10"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={capture}
              className="rounded-xl bg-cyan-500/90 hover:bg-cyan-500 text-white font-semibold px-4 py-2 transition"
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="rounded-xl bg-white/10 hover:bg-white/15 text-white/90 px-4 py-2 transition border border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}

export default ImageSourcePicker

