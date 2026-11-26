import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types"

const Flair: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const flair = fileData.frontmatter?.Flair

  if (!flair) return null

  return <div class="article-flair">{flair}</div>
}

export default (() => Flair) satisfies QuartzComponentConstructor