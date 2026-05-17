import { useEffect, useRef, useState, useCallback } from "react"

interface MasonryItem {
  id: number | string
}

interface MasonryProps<T extends MasonryItem> {
  items: T[]
  columnWidth?: number
  gap?: number
  renderItem: (item: T, index: number) => React.ReactNode
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(ref.current)
    setWidth(ref.current.offsetWidth)
    return () => ro.disconnect()
  }, [ref])
  return width
}

type Position = { left: number; top: number; width: number }

export function Masonry<T extends MasonryItem>({
  items,
  columnWidth = 300,
  gap = 16,
  renderItem,
}: MasonryProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)
  const heightCache = useRef<Map<number | string, number>>(new Map())
  const itemRefs = useRef<Map<number | string, HTMLDivElement>>(new Map())

  const [positions, setPositions] = useState<Map<number | string, Position>>(new Map())
  const [containerHeight, setContainerHeight] = useState(0)

  const columnCount = containerWidth
    ? Math.max(1, Math.floor((containerWidth + gap) / (columnWidth + gap)))
    : 1

  const colWidth = columnCount > 0
    ? (containerWidth - gap * (columnCount - 1)) / columnCount
    : columnWidth

  // Stable item key — serialized list of ids + colWidth
  const itemKey = items.map(i => i.id).join(",") + "|" + colWidth

  const computeLayout = useCallback(() => {
    const cache = heightCache.current
    const heights = new Array<number>(columnCount).fill(0)
    const newPositions = new Map<number | string, Position>()

    for (const item of items) {
      const h = cache.get(item.id)
      if (h == null) return // not all measured yet, bail
      const minCol = heights.indexOf(Math.min(...heights))
      newPositions.set(item.id, {
        left: minCol * (colWidth + gap),
        top: heights[minCol],
        width: colWidth,
      })
      heights[minCol] += h + gap
    }

    setPositions(newPositions)
    setContainerHeight(Math.max(...heights))
  }, [items, columnCount, colWidth, gap])

  // Only runs when items or colWidth actually change
  useEffect(() => {
    if (!colWidth) return

    // Invalidate cache entries whose colWidth has changed
    // (we store colWidth alongside height to detect this)
    const cacheKey = `${colWidth}`
    if ((heightCache.current as any)._colWidth !== cacheKey) {
      heightCache.current.clear()
      ;(heightCache.current as any)._colWidth = cacheKey
    }

    // Check if all items already cached
    const allCached = items.every(item => heightCache.current.has(item.id))
    if (allCached) {
      computeLayout()
      return
    }

    // Measure uncached items after paint
    const rafId = requestAnimationFrame(() => {
      let changed = false
      for (const item of items) {
        if (!heightCache.current.has(item.id)) {
          const el = itemRefs.current.get(item.id)
          if (el && el.offsetHeight > 0) {
            heightCache.current.set(item.id, el.offsetHeight)
            changed = true
          }
        }
      }
      if (changed) computeLayout()
    })

    return () => cancelAnimationFrame(rafId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey, computeLayout])

  return (
    <div ref={containerRef} className="relative w-full">
      <div style={{ position: "relative", height: containerHeight || "auto", minHeight: 100 }}>
        {items.map((item, i) => {
          const pos = positions.get(item.id)
          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el)
                else itemRefs.current.delete(item.id)
              }}
              style={pos
                ? { position: "absolute", left: pos.left, top: pos.top, width: pos.width }
                : { position: "absolute", top: 0, left: 0, width: colWidth, visibility: "hidden" }
              }
            >
              {renderItem(item, i)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
