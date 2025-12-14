"use client"

import { useEffect, useRef, useState } from "react"
import * as faceapi from "face-api.js"
import { Camera, AlertTriangle, CheckCircle } from "lucide-react"

interface WebcamMonitorProps {
  onFaceDetectionEvent?: (event: {
    type: 'no_face' | 'multiple_faces' | 'face_detected'
    count: number
    timestamp: number
  }) => void
  enabled?: boolean
}

export function WebcamMonitor({ onFaceDetectionEvent, enabled = true }: WebcamMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [faceCount, setFaceCount] = useState(0)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionInterval = useRef<NodeJS.Timeout | null>(null)

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models' // We'll need to add model files to public folder
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        
        setModelsLoaded(true)
        console.log('Face detection models loaded')
      } catch (err) {
        console.error('Error loading face detection models:', err)
        // Continue without models - will use basic webcam only
        setModelsLoaded(false)
      }
    }

    loadModels()
  }, [])

  // Start webcam
  useEffect(() => {
    if (!enabled) return

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          // Wait for the video to load before removing loading state
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => {
              console.error('Video play error:', err)
            })
            setIsLoading(false)
            setError(null)
          }
          streamRef.current = stream
        }
      } catch (err: any) {
        console.error('Webcam access error:', err)
        let errorMessage = 'Failed to access webcam'
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow access to camera.'
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device'
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use'
        }
        setError(errorMessage)
        setIsLoading(false)
      }
    }

    startWebcam()

    return () => {
      // Cleanup: stop webcam
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current)
      }
    }
  }, [enabled])

  // Face detection loop
  useEffect(() => {
    if (!videoRef.current || !modelsLoaded || !enabled) return

    const detectFaces = async () => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas) return

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()

        const count = detections.length
        setFaceCount(count)

        // Draw detections on canvas
        const displaySize = { width: video.width, height: video.height }
        faceapi.matchDimensions(canvas, displaySize)
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          faceapi.draw.drawDetections(canvas, resizedDetections)
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        }

        // Trigger events based on detection
        if (count === 0 && onFaceDetectionEvent) {
          onFaceDetectionEvent({
            type: 'no_face',
            count: 0,
            timestamp: Date.now()
          })
        } else if (count > 1 && onFaceDetectionEvent) {
          onFaceDetectionEvent({
            type: 'multiple_faces',
            count,
            timestamp: Date.now()
          })
        } else if (count === 1 && onFaceDetectionEvent) {
          onFaceDetectionEvent({
            type: 'face_detected',
            count: 1,
            timestamp: Date.now()
          })
        }
      } catch (err) {
        console.error('Face detection error:', err)
      }
    }

    // Run detection every 2 seconds
    detectionInterval.current = setInterval(detectFaces, 2000)

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current)
      }
    }
  }, [modelsLoaded, enabled, onFaceDetectionEvent])

  if (!enabled) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Proctoring disabled for this exam</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <Camera className="w-12 h-12 mx-auto mb-2 animate-pulse text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Starting webcam...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-destructive font-medium">Webcam Error</p>
        <p className="text-xs text-destructive/70 mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video w-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        
        {/* Face count indicator */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
          {faceCount === 1 ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              Face detected
            </>
          ) : faceCount === 0 ? (
            <>
              <AlertTriangle className="w-3 h-3 text-red-500" />
              No face detected
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              {faceCount} faces detected
            </>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {modelsLoaded ? (
          <span className="text-green-600">✓ AI monitoring active</span>
        ) : (
          <span className="text-amber-600">⚠ Basic monitoring (AI models not loaded)</span>
        )}
      </div>
    </div>
  )
}
