import {
  LineDotRightHorizontal,
  LifeBuoy,
} from "lucide-preact"

import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types"

const tagIcons: Record<string, any> = {
  spoke: LineDotRightHorizontal,
  hub: LifeBuoy,
}

const ArticleTitle: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  const tags = fileData.frontmatter?.tags ?? []

  const matchingTag = tags.find((tag) =>
    Object.keys(tagIcons).includes(tag.toLowerCase()),
  )

  const TagIcon = matchingTag ? tagIcons[matchingTag.toLowerCase()] : null

  if (!title) return null

  return (
    <h1 class="article-title">
      {TagIcon && <TagIcon size={28} strokeWidth={1.5} />}
      {title}
    </h1>
  )
}

export default (() => ArticleTitle) satisfies QuartzComponentConstructor