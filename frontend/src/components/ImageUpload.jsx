import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

function ImageUpload({ onImageProcessed }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)

  // Attach the stream after the <video> mounts; otherwise srcObject assignment
  // can be missed on the first open (black preview + capture fails).
  useEffect(() => {
    const videoEl = videoRef.current
    if (!showCamera || !stream || !videoEl) return
    videoEl.srcObject = stream
    const playPromise = videoEl.play?.()
    if (playPromise?.catch) playPromise.catch(() => {})
  }, [showCamera, stream])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    e.target.value = ''

    await uploadImage(file)
  }

  const uploadImage = async (file) => {
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      const fileName =
        typeof file?.name === 'string' && file.name.length > 0 ? file.name : 'upload.jpg'
      formData.append('image', file, fileName)

      const response = await axios.post('/api/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Prefer deterministic markdown generated from structured blocks when available.
      const md = response.data.blocksMarkdown || response.data.markdown
      onImageProcessed(md)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process image')
      console.error('Upload error:', err)
    } finally {
      // Ensure the file input is cleared so the next upload always triggers.
      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploading(false)
    }
  }

  const startCamera = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Camera not supported in this browser')
        return
      }

      // Prefer the back camera on mobile, but do NOT require it (desktop webcams
      // often don’t support facingMode=environment and will throw NotFoundError/OverconstrainedError).
      const preferredConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
        },
      }

      let mediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(preferredConstraints)
      } catch (e) {
        // Fallback: any available camera
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      setStream(mediaStream)
      setShowCamera(true)
    } catch (err) {
      const name = err?.name || 'Error'
      const msg = err?.message || String(err)

      // Helpful hints for common cases
      if (name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
        return
      }
      if (name === 'NotFoundError') {
        setError('No camera device found on this system.')
        return
      }
      if (name === 'NotReadableError') {
        setError('Camera is already in use by another application. Close other apps using the camera and try again.')
        return
      }

      setError(`Failed to access camera (${name}): ${msg}`)
    }
  }

  const stopCamera = () => {
    if (videoRef.current) videoRef.current.srcObject = null
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current

      if (!video.videoWidth || !video.videoHeight) {
        setError('Camera not ready yet — please wait a moment and try Capture again.')
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          stopCamera()
          await uploadImage(blob)
        }
      }, 'image/jpeg', 0.9)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Textbook Page</h2>
      
      {!showCamera ? (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Processing...' : 'Choose Image'}
          </button>
          
          <div className="text-center text-gray-500">or</div>
          
          <button
            onClick={startCamera}
            disabled={uploading}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Take Photo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

export default ImageUpload
