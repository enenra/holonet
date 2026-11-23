
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types"

import { resolveRelative, simplifySlug } from "../util/path"

const Properties: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const frontmatter = fileData.frontmatter ?? {}

  const properties = Object.entries(frontmatter).filter(
    ([key, value]) =>
      !["tags", "title"].includes(key.toLowerCase()) && value != null,
  )

  if (properties.length === 0) return null

  const renderValue = (value: unknown): any => {
    if (Array.isArray(value)) {
      return value.map((item, index) => (
        <span key={index}>
          {index > 0 && ", "}
          {renderValue(item)}
        </span>
      ))
    }

    if (typeof value === "string") {
      const parts = value.split(/(\[\[[^\]]+\]\])/g)

      return parts.map((part, index) => {
        const match = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)

        if (!match) return part

        const target = match[1].trim()
        const display = (match[2] ?? target).trim()
        const slug = simplifySlug(target)

        return (
          <a
            key={index}
            href={resolveRelative(fileData.slug!, slug)}
            class="internal"
          >
            {display}
          </a>
        )
      })
    }

    if (value && typeof value === "object") {
      return JSON.stringify(value)
    }

    return String(value ?? "")
  }

  return (
    <aside class="note-properties">
      <h3>Properties</h3>
      <dl>
        {properties.map(([key, value]) => (
          <div class="property-row" key={key}>
            <dt>{key}</dt>
            <dd>{renderValue(value)}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}

export default (() => Properties) satisfies QuartzComponentConstructor
