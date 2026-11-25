
import {
    LineDotRightHorizontal,
    LifeBuoy,
    LandPlot,
    Earth,
    MapPin,
    Swords,
    ShieldQuestionMark,
    UserGroup,
} from "lucide-preact"

import {
    QuartzComponent,
    QuartzComponentConstructor,
    QuartzComponentProps,
} from "./types"

const tagIcons: Record<string, any> = {
    spoke: LineDotRightHorizontal,
    hub: LifeBuoy,
    region: LandPlot,
    planet: Earth,
    location: MapPin,
    enemy: Swords,
    neutral: ShieldQuestionMark,
    faction: UserGroup,
}

const ArticleTitle: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const title = fileData.frontmatter?.title
    const tags = fileData.frontmatter?.tags ?? []

    const matchingTag = Object.keys(tagIcons).find((iconTag) =>
        tags.some((noteTag) => noteTag.toLowerCase() === iconTag),
    )

    const TagIcon = matchingTag ? tagIcons[matchingTag] : null
    const isUnpublished = tags.some(
        (tag) => tag.toLowerCase() === "unpublished",
    )

    if (!title) return null

    return (
        <>
            {isUnpublished && (
                <div class="unpublished-stripe" aria-label="Unpublished" />
            )}
            <h1 class="article-title">
                {TagIcon && <TagIcon size={28} strokeWidth={1.5} />}
                {title}
            </h1>
        </>
    )
}

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
