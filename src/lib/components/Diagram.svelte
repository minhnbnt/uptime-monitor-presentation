<script>
  import Zoomable from './Zoomable.svelte'

  let { diagram } = $props()
  let inited = false

  function renderMermaid(node, { diagram, m }) {
    if (!inited) {
      m.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#1E293B',
          primaryTextColor: '#F8FAFC',
          primaryBorderColor: '#334155',
          lineColor: '#22C55E',
          secondaryColor: '#0F172A',
          tertiaryColor: '#1E293B',
          fontSize: '14px',
        },
        flowchart: { useMaxWidth: true },
        sequence: { useMaxWidth: true },
      })
      inited = true
    }
    const id = 'mermaid-' + Math.random().toString(36).slice(2)
    m.render(id, diagram).then(({ svg }) => {
      node.innerHTML = svg
    })
  }
</script>

<Zoomable>
  {#key diagram}
    {#await import('mermaid') then { default: m }}
      <div use:renderMermaid={{ diagram, m }} class="min-h-[200px]"></div>
    {/await}
  {/key}
</Zoomable>
