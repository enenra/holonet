import { QuartzComponent, QuartzComponentConstructor } from "./types"

const SiteHeader: QuartzComponent = () => {
  return (
    <header class="site-header">
      <div class="site-header-inner">
        <a href="/" class="site-header-title">HOLONET DATA TERMINAL</a>
      </div>
    </header>
  )
}

export default (() => SiteHeader) satisfies QuartzComponentConstructor