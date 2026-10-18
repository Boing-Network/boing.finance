import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal windowed list (fixed row height): renders only the rows in view plus a small overscan, so lists with
 * thousands of tokens stay fast without a virtualization dependency.
 */
export default function VirtualList({ items, rowHeight = 60, height = 384, overscan = 6, renderRow, getKey, className = '', testId }) {
  const ref = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = useCallback((e) => setScrollTop(e.currentTarget.scrollTop), []);
  // New list (search / tab change): back to the top.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
    setScrollTop(0);
  }, [items]);
  const total = items.length * rowHeight;
  const viewH = Math.min(height, Math.max(total, rowHeight));
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(items.length, Math.ceil((scrollTop + viewH) / rowHeight) + overscan);
  const rows = [];
  for (let i = start; i < end; i += 1) {
    rows.push(
      <div key={getKey ? getKey(items[i], i) : i} style={{ position: 'absolute', top: i * rowHeight, left: 0, right: 0, height: rowHeight }}>
        {renderRow(items[i], i)}
      </div>
    );
  }
  return (
    <div ref={ref} onScroll={onScroll} className={`overflow-y-auto ${className}`} style={{ height: viewH, position: 'relative' }} data-testid={testId} role="listbox">
      <div style={{ height: total, position: 'relative' }}>{rows}</div>
    </div>
  );
}
