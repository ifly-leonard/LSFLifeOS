"use client"

import { Capacitor } from "@capacitor/core"
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera"
import { Directory, Filesystem } from "@capacitor/filesystem"

const WARDROBE_DIR = "wardrobe"

export type CaptureIntent = "camera" | "gallery"

export type CapturedImage = {
  blob: Blob
  filePath: string
  displayPath: string
}

async function ensureWardrobeDir() {
  try {
    await Filesystem.mkdir({
      path: WARDROBE_DIR,
      directory: Directory.Data,
      recursive: true,
    })
  } catch {
    // already exists or not available
  }
}

function makeFileName() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`
}

function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(",")
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : ""
      resolve(stripDataUrlPrefix(raw))
    }
    reader.onerror = () => reject(new Error("base64 conversion failed"))
    reader.readAsDataURL(blob)
  })
}

async function writeBlobToWardrobe(blob: Blob, fileName?: string): Promise<CapturedImage> {
  await ensureWardrobeDir()
  const finalName = fileName ?? makeFileName()
  const path = `${WARDROBE_DIR}/${finalName}`
  const data = await blobToBase64(blob)
  await Filesystem.writeFile({
    path,
    data,
    directory: Directory.Data,
    recursive: true,
  })
  const displayPath = await resolveWardrobeImageDisplayPath(path)
  return {
    blob,
    filePath: path,
    displayPath,
  }
}

export async function captureAndStoreWardrobeImage(intent: CaptureIntent): Promise<CapturedImage | null> {
  const source = intent === "camera" ? CameraSource.Camera : CameraSource.Photos
  const photo = await Camera.getPhoto({
    source,
    resultType: CameraResultType.Uri,
    quality: 90,
    correctOrientation: true,
  })

  if (!photo.webPath) return null
  const response = await fetch(photo.webPath)
  const blob = await response.blob()
  if (!blob.type.startsWith("image/")) {
    throw new Error("selected file is not an image")
  }

  return writeBlobToWardrobe(blob)
}

export async function saveWardrobeImageBlob(blob: Blob, ext = "jpg"): Promise<CapturedImage> {
  const cleanExt = ext.replace(".", "").toLowerCase() || "jpg"
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${cleanExt}`
  return writeBlobToWardrobe(blob, name)
}

export async function resolveWardrobeImageDisplayPath(storedPath: string): Promise<string> {
  if (!storedPath) return ""
  if (/^https?:\/\//i.test(storedPath) || storedPath.startsWith("data:") || storedPath.startsWith("blob:")) {
    return storedPath
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const { uri } = await Filesystem.getUri({
        directory: Directory.Data,
        path: storedPath,
      })
      return Capacitor.convertFileSrc(uri)
    }

    // Web fallback: read from Filesystem (IndexedDB-backed) and emit a data URL.
    const read = await Filesystem.readFile({
      directory: Directory.Data,
      path: storedPath,
    })
    const raw = typeof read.data === "string" ? read.data : ""
    if (!raw) return ""
    return `data:image/jpeg;base64,${raw}`
  } catch (err) {
    console.warn("[wardrobe] failed resolving local image display path", storedPath, err)
    return ""
  }
}

export async function deleteWardrobeImage(storedPath: string): Promise<boolean> {
  if (!storedPath) return true
  if (/^https?:\/\//i.test(storedPath) || storedPath.startsWith("data:") || storedPath.startsWith("blob:")) {
    return true
  }
  try {
    await Filesystem.deleteFile({
      path: storedPath,
      directory: Directory.Data,
    })
    return true
  } catch {
    return false
  }
}

export function isNativeAppRuntime(): boolean {
  return Capacitor.isNativePlatform()
}

