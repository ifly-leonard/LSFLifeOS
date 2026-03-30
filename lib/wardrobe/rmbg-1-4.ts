"use client"

import * as ort from "onnxruntime-web"

const RMBG_MODEL_URL = "https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx"
const RMBG_SIZE = 1024

let sessionPromise: Promise<ort.InferenceSession> | null = null

async function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(RMBG_MODEL_URL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    })
  }
  return sessionPromise
}

async function toImageData(blob: Blob): Promise<ImageData> {
  const src = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error("image decode failed"))
      i.src = src
    })
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2d context unavailable")
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  } finally {
    URL.revokeObjectURL(src)
  }
}

async function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("png encode failed"))
        return
      }
      resolve(blob)
    }, "image/png")
  })
}

function buildInputTensor(imageData: ImageData): ort.Tensor {
  const input = new Float32Array(1 * 3 * RMBG_SIZE * RMBG_SIZE)
  const { data } = imageData
  const planeSize = RMBG_SIZE * RMBG_SIZE

  // Normalize like the official RMBG utility:
  // image = image / 255.0; normalize(mean=[0.5,0.5,0.5], std=[1,1,1])
  for (let i = 0; i < planeSize; i++) {
    const p = i * 4
    input[i] = data[p] / 255 - 0.5
    input[planeSize + i] = data[p + 1] / 255 - 0.5
    input[planeSize * 2 + i] = data[p + 2] / 255 - 0.5
  }
  return new ort.Tensor("float32", input, [1, 3, RMBG_SIZE, RMBG_SIZE])
}

function tensorToMask01(tensor: ort.Tensor): Float32Array {
  const raw = tensor.data as Float32Array | number[]
  const data = raw instanceof Float32Array ? raw : Float32Array.from(raw)
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (let i = 0; i < data.length; i++) {
    const v = data[i]
    if (v < min) min = v
    if (v > max) max = v
  }
  const den = max - min || 1
  const out = new Float32Array(data.length)
  for (let i = 0; i < data.length; i++) {
    out[i] = (data[i] - min) / den
  }
  return out
}

function resizeMaskToOriginal(mask01: Float32Array, width: number, height: number): Uint8ClampedArray {
  const srcCanvas = document.createElement("canvas")
  srcCanvas.width = RMBG_SIZE
  srcCanvas.height = RMBG_SIZE
  const sctx = srcCanvas.getContext("2d")
  if (!sctx) throw new Error("mask context unavailable")
  const srcImage = sctx.createImageData(RMBG_SIZE, RMBG_SIZE)
  for (let i = 0; i < mask01.length; i++) {
    const p = i * 4
    const v = Math.max(0, Math.min(255, Math.round(mask01[i] * 255)))
    srcImage.data[p] = v
    srcImage.data[p + 1] = v
    srcImage.data[p + 2] = v
    srcImage.data[p + 3] = 255
  }
  sctx.putImageData(srcImage, 0, 0)

  const outCanvas = document.createElement("canvas")
  outCanvas.width = width
  outCanvas.height = height
  const octx = outCanvas.getContext("2d")
  if (!octx) throw new Error("output context unavailable")
  octx.imageSmoothingEnabled = true
  octx.drawImage(srcCanvas, 0, 0, width, height)
  return octx.getImageData(0, 0, width, height).data
}

export async function removeBackgroundWithRMBG14(image: Blob): Promise<Blob> {
  const session = await getSession()
  const imageData = await toImageData(image)

  const inputCanvas = document.createElement("canvas")
  inputCanvas.width = RMBG_SIZE
  inputCanvas.height = RMBG_SIZE
  const ictx = inputCanvas.getContext("2d")
  if (!ictx) throw new Error("input context unavailable")
  const srcCanvas = document.createElement("canvas")
  srcCanvas.width = imageData.width
  srcCanvas.height = imageData.height
  const sctx = srcCanvas.getContext("2d")
  if (!sctx) throw new Error("source context unavailable")
  sctx.putImageData(imageData, 0, 0)
  ictx.drawImage(srcCanvas, 0, 0, RMBG_SIZE, RMBG_SIZE)
  const resized = ictx.getImageData(0, 0, RMBG_SIZE, RMBG_SIZE)

  const input = buildInputTensor(resized)
  const inputName = session.inputNames[0]
  const outputs = await session.run({ [inputName]: input })
  const outputName = session.outputNames[0]
  const outputTensor = outputs[outputName]
  if (!outputTensor) throw new Error("RMBG-1.4 output tensor missing")

  const sourceCanvas = document.createElement("canvas")
  sourceCanvas.width = imageData.width
  sourceCanvas.height = imageData.height
  const srcCtx = sourceCanvas.getContext("2d")
  if (!srcCtx) throw new Error("source context unavailable")
  srcCtx.putImageData(imageData, 0, 0)

  const outCanvas = document.createElement("canvas")
  outCanvas.width = imageData.width
  outCanvas.height = imageData.height
  const octx = outCanvas.getContext("2d")
  if (!octx) throw new Error("output context unavailable")

  const out = octx.createImageData(imageData.width, imageData.height)
  const srcData = imageData.data
  const mask01 = tensorToMask01(outputTensor)
  const maskData = resizeMaskToOriginal(mask01, imageData.width, imageData.height)
  const pixels = imageData.width * imageData.height

  for (let i = 0; i < pixels; i++) {
    const p = i * 4
    out.data[p] = srcData[p]
    out.data[p + 1] = srcData[p + 1]
    out.data[p + 2] = srcData[p + 2]
    out.data[p + 3] = maskData[p]
  }

  octx.putImageData(out, 0, 0)
  return await toPngBlob(outCanvas)
}

