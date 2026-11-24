import {
    QuartzComponent,
    QuartzComponentConstructor,
    QuartzComponentProps,
} from "./types"

import { resolveRelative, simplifySlug, FullSlug } from "../util/path"


const Properties: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter ?? {}

    const properties = Object.entries(frontmatter).filter(
        ([key, value]) =>
            !["tags", "title"].includes(key.toLowerCase()) && value != null,
    )

    if (properties.length === 0) return null

    const normalize = (value: string) =>
        value
            .replace(/\\/g, "/")
            .replace(/\.md$/i, "")
            .split("/")
            .map((segment) => segment.trim().replace(/\s+/g, "-").toLowerCase())
            .join("/")

    const findTarget = (target: string) => {
        const normalizedTarget = normalize(target)
        const currentPath = normalize(fileData.slug!).split("/")

        // Remove the current note's filename.
        currentPath.pop()

        // Search the current folder and parent folders, nearest first.
        for (let depth = currentPath.length; depth >= 0; depth--) {
            const folderPath = [
                ...currentPath.slice(0, depth),
                normalizedTarget,
            ].join("/")

            const candidates = [
                folderPath,
                `${folderPath}/${normalizedTarget}`,
                `${folderPath}/index`,
            ]

            const match = allFiles.find((file) =>
                candidates.includes(normalize(file.slug!)),
            )

            if (match) return match
        }

        // Try a vault-wide suffix match.
        const suffixMatch = allFiles.find((file) => {
            const slug = normalize(file.slug!)
            return (
                slug.endsWith("/" + normalizedTarget) ||
                slug.endsWith("/" + normalizedTarget + "/" + normalizedTarget)
            )
        })

        if (suffixMatch) return suffixMatch

        // Try matching a filename.
        if (!normalizedTarget.includes("/")) {
            return allFiles.find(
                (file) =>
                    normalize(file.slug!).split("/").at(-1) === normalizedTarget,
            )
        }

        return undefined
    }

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
                const targetFile = findTarget(target)

                const targetSlug = targetFile
                    ? simplifySlug(targetFile.slug!)
                    : simplifySlug(target as FullSlug)

                return (
                    <a
                        key={index}
                        href={resolveRelative(fileData.slug! as FullSlug, targetSlug)}
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