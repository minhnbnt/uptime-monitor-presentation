<script>
  import mermaid from 'mermaid'

  let { diagram, dark = true } = $props()

  let container = $state(null)
  let rendered = $state(false)
  let inited = $state(false)

  $effect(() => {
    if (!inited) {
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? 'dark' : 'default',
        themeVariables: dark ? {
          primaryColor: '#1E293B',
          primaryTextColor: '#F8FAFC',
          primaryBorderColor: '#334155',
          lineColor: '#22C55E',
          secondaryColor: '#0F172A',
          tertiaryColor: '#1E293B',
          fontSize: '14px',
        } : {},
        flowchart: { useMaxWidth: true },
        sequence: { useMaxWidth: true },
      })
      inited = true
    }
  })

  $effect(() => {
    if (container && diagram) {
      rendered = false
      container.innerHTML = ''
      const id = 'mermaid-' + Math.random().toString(36).slice(2)
      mermaid.render(id, diagram).then(({ svg }) => {
        container.innerHTML = svg
        rendered = true
      })
    }
  })
</script>

<div bind:this={container} class="diagram-container {rendered ? '' : 'min-h-[200px]'}"></div>
