<script>
  import Zoomable from './Zoomable.svelte'

  let { diagram, dark = true } = $props()

  function initMermaid(m) {
    m.initialize({
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
  }

  function renderMermaid(node, { diagram, m }) {
    const id = 'mermaid-' + Math.random().toString(36).slice(2)
    m.render(id, diagram).then(({ svg }) => {
      node.innerHTML = svg
    })
  }
</script>

<Zoomable>
  {#await import('mermaid') then { default: m }}
    {@const _ = initMermaid(m)}
    <div use:renderMermaid={{ diagram, m }} class="min-h-[200px]"></div>
  {/await}
</Zoomable>
