<script>
  let { children } = $props()

  let container = $state(null)
  let wrapper = $state(null)

  let scale = $state(1)
  let tx = $state(0)
  let ty = $state(0)
  let dragging = $state(false)
  let dragStart = $state({ x: 0, y: 0 })
  let dragOffset = $state({ x: 0, y: 0 })

  let transformStyle = $derived(`translate(${tx}px, ${ty}px) scale(${scale})`)

  function onWheel(e) {
    e.preventDefault()
    const rect = container.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const delta = -e.deltaY
    const factor = delta > 0 ? 1.1 : 1 / 1.1
    const ns = Math.min(Math.max(scale * factor, 0.25), 4)
    tx = mx - (mx - tx) * (ns / scale)
    ty = my - (my - ty) * (ns / scale)
    scale = ns
  }

  function onPointerDown(e) {
    dragging = true
    dragStart = { x: e.clientX, y: e.clientY }
    dragOffset = { x: tx, y: ty }
    container.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragging) return
    tx = dragOffset.x + (e.clientX - dragStart.x)
    ty = dragOffset.y + (e.clientY - dragStart.y)
  }

  function onPointerUp() {
    dragging = false
  }
</script>

<div
  bind:this={container}
  role="application"
  class="diagram-container {dragging ? 'grabbing' : ''}"
  style="cursor: grab"
  onwheel={onWheel}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  ondragstart={(e) => e.preventDefault()}
>
  <div bind:this={wrapper} class="diagram-transform" style="transform: {transformStyle}; transform-origin: 0 0">
    {@render children()}
  </div>
</div>
