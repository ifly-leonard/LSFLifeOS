"use client"

import { useCallback, useRef, useState } from "react"
import { removeBackgroundClient } from "@/lib/wardrobe/background-remove"
import {
  extractWardrobeItemFromImage,
  type ExtractedWardrobeDraft,
} from "@/lib/wardrobe/extract-item"
import {
  captureAndStoreWardrobeImage,
  deleteWardrobeImage,
  saveWardrobeImageBlob,
  type CaptureIntent,
} from "@/lib/wardrobe/local-image-storage"

export type AddItemPhase =
  | "idle"
  | "showing_tips"
  | "capturing"
  | "previewing"
  | "processing"
  | "extracted"
  | "failed"

export type PendingCaptureIntent = "camera" | "gallery"

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error("read failed"))
    r.readAsDataURL(blob)
  })
}

async function detectPaletteHexes(blob: Blob, maxColors = 8): Promise<string[]> {
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error("decode failed"))
      i.src = url
    })
    const w = Math.max(1, Math.min(320, img.naturalWidth || img.width))
    const h = Math.max(1, Math.min(320, img.naturalHeight || img.height))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    const buckets = new Map<string, { r: number; g: number; b: number; c: number }>()
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 24) continue
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`
      const prev = buckets.get(key)
      if (prev) {
        prev.r += r
        prev.g += g
        prev.b += b
        prev.c += 1
      } else {
        buckets.set(key, { r, g, b, c: 1 })
      }
    }
    const ranked = [...buckets.values()]
      .sort((a, b) => b.c - a.c)
      .slice(0, maxColors)
      .map((v) => {
        const r = Math.round(v.r / v.c)
        const g = Math.round(v.g / v.c)
        const b = Math.round(v.b / v.c)
        return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`
      })
    return ranked
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function useWardrobeAddFlow() {
  const [phase, setPhase] = useState<AddItemPhase>("idle")
  const [pendingIntent, setPendingIntent] = useState<PendingCaptureIntent | null>(null)
  const [rawImageBlob, setRawImageBlob] = useState<Blob | null>(null)
  const [storedImagePath, setStoredImagePath] = useState<string | null>(null)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null)
  const [formImageDisplayPath, setFormImageDisplayPath] = useState<string | null>(null)
  const [dominantColorHex, setDominantColorHex] = useState<string | null>(null)
  const [detectedPaletteHexes, setDetectedPaletteHexes] = useState<string[]>([])
  const [draft, setDraft] = useState<ExtractedWardrobeDraft | null>(null)
  const [bgRemovalFailed, setBgRemovalFailed] = useState(false)
  const [extractionFailed, setExtractionFailed] = useState(false)
  const [processingLabel, setProcessingLabel] = useState("")
  const [permissionHint, setPermissionHint] = useState<string | null>(null)

  const previewObjectUrlRef = useRef<string | null>(null)

  const revokePreview = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setPreviewObjectUrl(null)
  }, [])

  const resetCaptureState = useCallback(() => {
    revokePreview()
    setRawImageBlob(null)
    setStoredImagePath(null)
    setPendingIntent(null)
    setPermissionHint(null)
  }, [revokePreview])

  const goIdle = useCallback(() => {
    setPhase("idle")
    resetCaptureState()
    setDraft(null)
    setFormImageDisplayPath(null)
    setDominantColorHex(null)
    setDetectedPaletteHexes([])
    setBgRemovalFailed(false)
    setExtractionFailed(false)
    setProcessingLabel("")
  }, [resetCaptureState])

  const openCameraIntent = useCallback(() => {
    setPermissionHint(null)
    setPendingIntent("camera")
    setPhase("showing_tips")
  }, [])

  const openGalleryIntent = useCallback(() => {
    setPermissionHint(null)
    setPendingIntent("gallery")
    setPhase("showing_tips")
  }, [])

  const confirmTipsOpenCapture = useCallback(() => {
    setPhase("capturing")
  }, [])

  const backFromTips = useCallback(() => {
    setPhase("idle")
    setPendingIntent(null)
  }, [])

  const setCameraPermissionHint = useCallback(() => {
    setPermissionHint(
      "Camera access was blocked. Allow camera in your browser or site settings, then try again.",
    )
    setPhase("idle")
    setPendingIntent(null)
  }, [])

  const startCapture = useCallback(async () => {
    if (!pendingIntent) return
    setPermissionHint(null)
    setPhase("capturing")
    try {
      const captured = await captureAndStoreWardrobeImage(pendingIntent as CaptureIntent)
      if (!captured) {
        setPhase("idle")
        setPendingIntent(null)
        return
      }
      revokePreview()
      setRawImageBlob(captured.blob)
      setStoredImagePath(captured.filePath)
      previewObjectUrlRef.current = captured.displayPath
      setPreviewObjectUrl(captured.displayPath)
      setPhase("previewing")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ""
      if (msg.includes("cancel")) {
        setPhase("idle")
        setPendingIntent(null)
        return
      }
      if (msg.includes("permission")) {
        setCameraPermissionHint()
        return
      }
      setPermissionHint("Could not capture image. Please try again.")
      setPhase("idle")
      setPendingIntent(null)
    }
  }, [pendingIntent, revokePreview, setCameraPermissionHint])

  const retakeFromPreview = useCallback(async () => {
    if (storedImagePath) {
      await deleteWardrobeImage(storedImagePath)
    }
    resetCaptureState()
    setPhase("idle")
  }, [resetCaptureState, storedImagePath])

  const acceptPreview = useCallback(async () => {
    if (!rawImageBlob) return
    setPhase("processing")
    setBgRemovalFailed(false)
    setExtractionFailed(false)
    setDraft(null)

    let cleaned: Blob | undefined

    setProcessingLabel("Cleaning image")
    try {
      const removed = await removeBackgroundClient(rawImageBlob)
      if (removed.usedFallback) {
        setBgRemovalFailed(true)
      } else {
        cleaned = removed.blob
      }
    } catch {
      setBgRemovalFailed(true)
    }

    setProcessingLabel("Identifying item")
    await new Promise((r) => setTimeout(r, 250))

    setProcessingLabel("Filling details")
    try {
      const extracted = await extractWardrobeItemFromImage({
        image: rawImageBlob,
        cleanedImage: cleaned,
      })
      const displayBlob = cleaned ?? rawImageBlob
      const palette = await detectPaletteHexes(displayBlob)
      setDetectedPaletteHexes(palette)
      setDominantColorHex(palette[0] ?? null)

      if (cleaned && storedImagePath) {
        const cleanedSaved = await saveWardrobeImageBlob(cleaned, "png")
        await deleteWardrobeImage(storedImagePath)
        setStoredImagePath(cleanedSaved.filePath)
        setFormImageDisplayPath(cleanedSaved.displayPath)
        previewObjectUrlRef.current = cleanedSaved.displayPath
      } else {
        const dataUrl = await blobToDataUrl(displayBlob)
        setFormImageDisplayPath(dataUrl)
      }
      setDraft(extracted)
      setExtractionFailed(false)
      setPhase("extracted")
    } catch {
      setExtractionFailed(true)
      try {
        const dataUrl = await blobToDataUrl(cleaned ?? rawImageBlob)
        setFormImageDisplayPath(dataUrl)
      } catch {
        setFormImageDisplayPath(previewObjectUrl)
      }
      setDraft(null)
      setPhase("failed")
    } finally {
      setProcessingLabel("")
    }
  }, [rawImageBlob, previewObjectUrl, storedImagePath])

  const retakeFromForm = useCallback(async () => {
    if (storedImagePath) {
      await deleteWardrobeImage(storedImagePath)
    }
    goIdle()
  }, [goIdle, storedImagePath])

  return {
    phase,
    pendingIntent,
    rawImageBlob,
    storedImagePath,
    previewObjectUrl,
    formImageDisplayPath,
    dominantColorHex,
    detectedPaletteHexes,
    draft,
    bgRemovalFailed,
    extractionFailed,
    processingLabel,
    permissionHint,
    goIdle,
    openCameraIntent,
    openGalleryIntent,
    confirmTipsOpenCapture,
    backFromTips,
    startCapture,
    retakeFromPreview,
    acceptPreview,
    retakeFromForm,
    setCameraPermissionHint,
  }
}
