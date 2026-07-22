<script>
  import { fly, fade } from 'svelte/transition'
  import { slides } from './lib/slides/index.js'
  import Diagram from './lib/components/Diagram.svelte'
  import Zoomable from './lib/components/Zoomable.svelte'

  let current = $state(0)
  let dir = $state(1)
  let touchStartX = $state(0)
  let syncing = $state(false)

  function syncUrl(i) {
    const p = new URLSearchParams(location.search)
    p.set('s', String(i + 1))
    history.replaceState(null, '', '?' + p.toString())
  }

  function go(i) {
    if (i === current || i < 0 || i >= slides.length) return
    dir = i > current ? 1 : -1
    current = i
    syncUrl(i)
  }

  $effect(() => {
    const p = new URLSearchParams(location.search)
    const n = parseInt(p.get('s'))
    if (n > 0 && n <= slides.length) current = n - 1
  })
  function next() { go(current + 1) }
  function prev() { go(current - 1) }

  function handleKey(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Space') {
      e.preventDefault(); next()
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault(); prev()
    }
    if (e.key === 'Home') go(0)
    if (e.key === 'End') go(slides.length - 1)
    if (e.key === 'g') {
      e.preventDefault()
      const n = prompt('Go to slide (1-' + slides.length + '):')
      if (n) go(Math.max(0, Math.min(slides.length - 1, parseInt(n) - 1)))
    }
  }

  function handleTouchStart(e) { touchStartX = e.touches[0].clientX }
  function handleTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev()
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- Background orbs -->
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>

<div
  role="region"
  class="fixed inset-0 bg-grid"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  {#key current}
    <div class="slide-outer" in:fly={{ duration: 350, x: dir * 80, opacity: 0 }} out:fly={{ duration: 250, x: dir * -60, opacity: 0 }}>
      <div class="slide-inner">
        {#if slides[current].type === 'title'}
          <div class="text-center max-w-3xl mx-auto">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cta-dim border border-cta/20 text-cta text-xs font-heading font-semibold tracking-wide mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-cta"></span>
              System Design Presentation
            </div>
            <h1 class="font-heading font-bold text-[clamp(2.8rem,5.5vw,5rem)] tracking-tight leading-[1.1] mb-4 title-glow">
              {slides[current].title}
            </h1>
            <p class="font-heading text-[clamp(1.1rem,1.8vw,1.6rem)] font-medium text-cta mb-3">
              {slides[current].subtitle}
            </p>
            <div class="flex items-center justify-center gap-3 mt-6">
              <span class="badge">Go 1.26</span>
              <span class="badge">PostgreSQL</span>
              <span class="badge">Redis</span>
              <span class="badge">Temporal</span>
            </div>
          </div>

        {:else if slides[current].type === 'list'}
          <div class="max-w-2xl mx-auto">
            <h2 class="font-heading font-bold text-[clamp(1.8rem,3vw,2.6rem)] text-text tracking-tight mb-8 text-center">
              {slides[current].title}
            </h2>
            <ul class="space-y-3">
              {#each slides[current].items as item (item)}
                <li class="flex items-center gap-4 text-text-muted text-[clamp(0.9rem,1.3vw,1.05rem)] leading-relaxed group">
                  <span class="w-2.5 h-2.5 rounded-full bg-cta/40 group-hover:bg-cta shrink-0 transition-colors duration-200"></span>
                  {item}
                </li>
              {/each}
            </ul>
          </div>

        {:else if slides[current].type === 'section'}
          <div class="text-center max-w-2xl mx-auto">
            <div class="section-deco">
              <span>{slides[current].number}</span>
            </div>
            <h2 class="font-heading font-bold text-[clamp(2rem,4vw,3.2rem)] text-text tracking-tight leading-tight">
              {slides[current].title}
            </h2>
            <div class="w-16 h-1 bg-cta/40 rounded-full mx-auto mt-6"></div>
          </div>

        {:else if slides[current].type === 'requirements'}
          <div class="max-w-5xl mx-auto">
            <h2 class="font-heading font-bold text-[clamp(1.6rem,2.5vw,2.2rem)] text-text tracking-tight mb-6">
              {slides[current].title}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="card">
                <h3 class="font-heading font-semibold text-text mb-3 text-base flex items-center gap-2">
                  <span class="flex items-center justify-center w-6 h-6 rounded-full bg-cta-dim text-cta text-xs font-bold">✓</span>
                  Functional
                </h3>
                <ul class="space-y-1">
                  {#each slides[current].func as item (item)}
                    <li class="pl-5 relative text-text-muted text-sm leading-relaxed
                      before:content-[''] before:absolute before:left-0 before:top-[0.6em]
                      before:w-1.5 before:h-1.5 before:rounded-full before:bg-cta/50">{item}</li>
                  {/each}
                </ul>
              </div>
              <div class="card">
                <h3 class="font-heading font-semibold text-text mb-3 text-base flex items-center gap-2">
                  <span class="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/15 text-amber-400 text-xs font-bold">⚡</span>
                  Non-functional
                </h3>
                <ul class="space-y-1">
                  {#each slides[current].nonfunc as item (item)}
                    <li class="pl-5 relative text-text-muted text-sm leading-relaxed
                      before:content-[''] before:absolute before:left-0 before:top-[0.6em]
                      before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-400/50">{item}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>

        {:else if slides[current].type === 'tech-stack'}
          <div class="max-w-5xl mx-auto">
            <h2 class="font-heading font-bold text-[clamp(1.6rem,2.5vw,2.2rem)] text-text tracking-tight mb-6">
              {slides[current].title}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each slides[current].items as item (item.name)}
                <div class="flex items-start gap-4 bg-surface/70 border border-border rounded-xl p-4 hover:border-cta/40 hover:bg-surface transition-all duration-200">
                  <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-cta-dim text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-heading font-semibold text-text text-sm mb-0.5">{item.name}</h4>
                    <p class="text-text-muted text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>

        {:else if slides[current].type === 'layers'}
          <div class="max-w-2xl mx-auto">
            <h2 class="font-heading font-bold text-[clamp(1.6rem,2.5vw,2.2rem)] text-text tracking-tight mb-7 text-center">
              {slides[current].title}
            </h2>
            <div class="flex flex-col items-center gap-0">
              {#each slides[current].layers as layer, li (layer.label)}
                <div class="flex items-center gap-5 bg-surface/70 border border-border rounded-xl px-5 py-3.5 w-full max-w-md group hover:border-cta/30 transition-all duration-200">
                  <span class="font-mono text-sm font-semibold text-cta shrink-0 w-28">{layer.label}</span>
                  <span class="text-text-muted text-sm leading-snug">{layer.desc}</span>
                </div>
                {#if li < slides[current].layers.length - 1}
                  <div class="flex items-center justify-center py-1 text-cta/40">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14m0 0-6-6m6 6 6-6"/></svg>
                  </div>
                {/if}
              {/each}
            </div>
            {#if slides[current].note}
              <div class="mt-5 px-4 py-2.5 rounded-lg bg-cta-dim border border-cta/10 text-center">
                <p class="text-text-muted text-xs">{slides[current].note}</p>
              </div>
            {/if}
          </div>

        {:else if slides[current].type === 'diagram'}
          <div class="max-w-6xl mx-auto">
            <h2 class="font-heading font-bold text-[clamp(1.4rem,2.2vw,2rem)] text-text tracking-tight mb-4 text-center">
              {slides[current].title}
            </h2>
            <Diagram diagram={slides[current].diagram} />
          </div>

        {:else if slides[current].type === 'screenshot'}
          <div class="max-w-5xl mx-auto w-full h-full flex flex-col">
            <h2 class="font-heading font-bold text-[clamp(1.4rem,2.2vw,2rem)] text-text tracking-tight mb-2 text-center shrink-0">
              {slides[current].title}
            </h2>
            {#if slides[current].caption}
              <p class="text-text-muted text-sm text-center mb-3 max-w-2xl mx-auto shrink-0">{slides[current].caption}</p>
            {/if}
            <div class="flex-1 min-h-0">
              <Zoomable>
                <img
                  src={slides[current].src}
                  alt={slides[current].title}
                  class="rounded-lg"
                  draggable="false"
                />
              </Zoomable>
            </div>
          </div>

        {:else if slides[current].type === 'db-schema'}
          <div class="max-w-6xl mx-auto w-full">
            <h2 class="font-heading font-bold text-[clamp(1.4rem,2.2vw,2rem)] text-text tracking-tight mb-2">
              {slides[current].title}
            </h2>
            {#if slides[current].note}
              <p class="text-text-muted text-xs mb-4">{slides[current].note}</p>
            {/if}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each slides[current].tables as table (table.name)}
                <div class="card">
                  <h3 class="font-mono text-sm font-semibold text-cta mb-2.5">{table.name}</h3>
                  <div class="flex flex-wrap gap-1.5 mb-2.5">
                    {#each table.cols as col (col)}
                      <span class="badge">{col}</span>
                    {/each}
                  </div>
                  <p class="text-text-muted text-xs leading-relaxed">{table.desc}</p>
                </div>
              {/each}
            </div>
          </div>

        {:else if slides[current].type === 'erd'}
          <div class="max-w-5xl mx-auto w-full">
            <h2 class="font-heading font-bold text-[clamp(1.4rem,2.2vw,2rem)] text-text tracking-tight mb-4 text-center">
              {slides[current].title}
            </h2>
            <Zoomable>
              <object
                data="assets/sql-import.svg"
                type="image/svg+xml"
                class="w-full h-full"
                draggable="false"
                aria-label="SQL Import Diagram"
              ></object>
            </Zoomable>
          </div>

        {:else if slides[current].type === 'scheduling'}
          <div class="max-w-5xl mx-auto">
            <h2 class="font-heading font-bold text-[clamp(1.4rem,2.2vw,2rem)] text-text tracking-tight mb-3 text-center">
              {slides[current].title}
            </h2>
            {#if slides[current].subtitle}
              <p class="font-heading text-base font-medium text-cta text-center mb-5">{slides[current].subtitle}</p>
            {/if}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="card">
                <div class="flex items-center gap-2 mb-3">
                  <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-cta-dim text-cta text-sm font-bold">Z</span>
                  <h3 class="font-heading font-semibold text-text text-sm">{slides[current].zset.title}</h3>
                </div>
                <ul class="space-y-1.5">
                  {#each slides[current].zset.items as item (item)}
                    <li class="pl-4 relative text-text-muted text-sm leading-snug
                      before:content-[''] before:absolute before:left-0 before:top-[0.55em]
                      before:w-1 before:h-1 before:rounded-full before:bg-cta/60">{item}</li>
                  {/each}
                </ul>
              </div>
              <div class="card">
                <div class="flex items-center gap-2 mb-3">
                  <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 text-sm font-bold">T</span>
                  <h3 class="font-heading font-semibold text-text text-sm">{slides[current].temporal.title}</h3>
                </div>
                <ul class="space-y-1.5">
                  {#each slides[current].temporal.items as item (item)}
                    <li class="pl-4 relative text-text-muted text-sm leading-snug
                      before:content-[''] before:absolute before:left-0 before:top-[0.55em]
                      before:w-1 before:h-1 before:rounded-full before:bg-blue-400/60">{item}</li>
                  {/each}
                </ul>
              </div>
            </div>
            {#if slides[current].note}
              <div class="mt-4 px-4 py-2 rounded-lg bg-cta-dim border border-cta/10 text-center">
                <p class="text-text-muted text-xs font-mono">{slides[current].note}</p>
              </div>
            {/if}
          </div>

        {:else if slides[current].type === 'two-column'}
          <div class="max-w-5xl mx-auto w-full">
            <h2 class="font-heading font-bold text-[clamp(1.4rem,2.2vw,2rem)] text-text tracking-tight mb-5 text-center">
              {slides[current].title}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="card">
                <h3 class="font-heading font-semibold text-cta mb-3 text-sm">{slides[current].left.title}</h3>
                <ul class="space-y-1.5">
                  {#each slides[current].left.items as item (item)}
                    <li class="pl-4 relative text-text-muted text-sm leading-snug
                      before:content-[''] before:absolute before:left-0 before:top-[0.55em]
                      before:w-1 before:h-1 before:rounded-full before:bg-cta/60">{item}</li>
                  {/each}
                </ul>
              </div>
              <div class="card">
                <h3 class="font-heading font-semibold text-cta mb-3 text-sm">{slides[current].right.title}</h3>
                <ul class="space-y-1.5">
                  {#each slides[current].right.items as item (item)}
                    <li class="pl-4 relative text-text-muted text-sm leading-snug
                      before:content-[''] before:absolute before:left-0 before:top-[0.55em]
                      before:w-1 before:h-1 before:rounded-full before:bg-blue-400/60">{item}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>

        {:else if slides[current].type === 'card-grid'}
          <div class="max-w-5xl mx-auto w-full">
            <h2 class="font-heading font-bold text-[clamp(1.4rem,2.2vw,2rem)] text-text tracking-tight mb-5 text-center">
              {slides[current].title}
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each slides[current].cards as card (card.title)}
                <div class="card">
                  <h3 class="flex items-center gap-2 font-heading font-semibold text-text mb-2 text-sm">
                    <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-hover text-sm">{card.icon}</span>
                    {card.title}
                  </h3>
                  <p class="text-text-muted text-sm leading-snug pl-9">{card.desc}</p>
                </div>
              {/each}
            </div>
          </div>

        {:else if slides[current].type === 'deployment'}
          <div class="max-w-3xl mx-auto w-full">
            <h2 class="font-heading font-bold text-[clamp(1.4rem,2.2vw,2rem)] text-text tracking-tight mb-5 text-center">
              {slides[current].title}
            </h2>
            <div class="space-y-3">
              {#each slides[current].items as item (item.title)}
                <div class="flex items-start gap-4 bg-surface/70 border border-border rounded-xl px-5 py-3.5 hover:border-cta/30 transition-all duration-200">
                  <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-cta-dim text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 class="font-heading font-semibold text-text text-sm">{item.title}</h4>
                    <p class="text-text-muted text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>

        {:else if slides[current].type === 'qa'}
          <div class="text-center max-w-xl mx-auto">
            <div class="section-deco mb-6">
              <span>?</span>
            </div>
            <h2 class="font-heading font-bold text-[clamp(2.5rem,5vw,4rem)] text-text tracking-tight mb-3">{slides[current].title}</h2>
            <div class="w-16 h-1 bg-cta/40 rounded-full mx-auto mb-6"></div>
            <p class="font-heading font-medium text-[clamp(1.5rem,2.5vw,2.5rem)] text-cta">{slides[current].subtitle}</p>
          </div>
        {/if}
      </div>
    </div>
  {/key}
</div>

<!-- Navigation -->
<nav class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-gradient-to-t from-bg via-bg/95 to-transparent">
  <button
    onclick={prev}
    disabled={current === 0}
    class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-heading font-medium transition-all duration-200 pointer-events-auto
      {current > 0
        ? 'text-text-muted hover:text-cta hover:bg-cta-dim cursor-pointer'
        : 'text-text-muted/20 cursor-default'}"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    Back
  </button>

  <div class="flex items-center gap-1.5 pointer-events-auto">
    {#each slides as _, i (i)}
      <button
        onclick={() => go(i)}
        class="h-1.5 rounded-full transition-all duration-300 cursor-pointer
          {i === current
            ? 'w-6 bg-cta'
            : 'w-1.5 bg-text-muted/20 hover:bg-text-muted/40'}"
        aria-label="Go to slide {i + 1}"
      ></button>
    {/each}
  </div>

  <button
    onclick={next}
    disabled={current === slides.length - 1}
    class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-heading font-medium transition-all duration-200 pointer-events-auto
      {current < slides.length - 1
        ? 'text-text-muted hover:text-cta hover:bg-cta-dim cursor-pointer'
        : 'text-text-muted/20 cursor-default'}"
  >
    Next
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  </button>
</nav>

<div class="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 text-text-muted/30 text-xs font-mono pointer-events-none select-none">
  {current + 1} / {slides.length}
</div>
