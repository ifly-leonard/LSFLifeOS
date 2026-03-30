"use client"

import { useCallback, useEffect, useState } from "react"
import { Shirt } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveWardrobeImageDisplayPath } from "@/lib/wardrobe/local-image-storage"

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 flex-col items-center justify-center gap-1 bg-muted px-2 py-2 text-muted-foreground/35",
        className
      )}
      role="img"
      aria-label="image loading error"
    >
      <Shirt className="h-[28%] w-[28%] min-h-6 min-w-6 max-h-14 max-w-14 shrink-0" strokeWidth={1.25} />
      <span className="text-center text-[7px] font-bold uppercase leading-tight tracking-widest text-muted-foreground/60">
        image loading error
      </span>
    </div>
  )
}

type WardrobeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null
}

export function WardrobeImage({
  src,
  alt = "",
  className,
  onError,
  onDragStart,
  ...rest
}: WardrobeImageProps) {
  const [failed, setFailed] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState("")
  const safeSrc = typeof src === "string" ? src.trim() : ""

  useEffect(() => {
    setFailed(false)
  }, [safeSrc])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!safeSrc) {
        setResolvedSrc("")
        return
      }
      const display = await resolveWardrobeImageDisplayPath(safeSrc)
      if (!cancelled) setResolvedSrc(display)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [safeSrc])

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setFailed(true)
      onError?.(e)
    },
    [onError]
  )

  // Prevent native browser “drag image” behavior so pointer-drag on canvases works reliably.
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLImageElement>) => {
      e.preventDefault()
      onDragStart?.(e)
    },
    [onDragStart],
  )

  if (!resolvedSrc || failed) {
    return <ImagePlaceholder className={className} />
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={handleError}
      draggable={false}
      onDragStart={handleDragStart}
      {...rest}
    />
  )
}
