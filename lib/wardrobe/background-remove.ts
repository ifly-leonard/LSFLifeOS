export type RemoveBackgroundResult = {
  blob: Blob
  /** True when removal failed or was skipped; caller should use original image. */
  usedFallback: boolean
}

export async function removeBackgroundClient(image: Blob): Promise<RemoveBackgroundResult> {
  try {
    const { removeBackgroundWithRMBG14 } = await import("@/lib/wardrobe/rmbg-1-4")
    const out = await removeBackgroundWithRMBG14(image)
    return { blob: out, usedFallback: false }
  } catch (err) {
    console.warn("[wardrobe] RMBG-1.4 cleanup failed; trying secondary cleanup", err)
    try {
      const mod = await import("@imgly/background-removal")
      const removeBackground = (mod as { default?: (b: Blob, cfg?: { device?: "cpu" | "gpu" }) => Promise<Blob> }).default
      if (typeof removeBackground !== "function") throw new Error("Missing @imgly/background-removal default export")
      const imglyOut = await removeBackground(image, { device: "cpu" })
      return { blob: imglyOut, usedFallback: false }
    } catch (imglyErr) {
      console.warn("[wardrobe] secondary cleanup failed; using original image", imglyErr)
      return { blob: image, usedFallback: true }
    }
  }
}
