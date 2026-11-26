function toggleCallout(this: HTMLElement) {
    const outerBlock = this.parentElement!
    outerBlock.classList.toggle("is-collapsed")
    const collapsed = outerBlock.classList.contains("is-collapsed")
    const height = collapsed ? this.scrollHeight : outerBlock.scrollHeight
    outerBlock.style.maxHeight = height + "px"

    // walk and adjust height of all parents
    let current = outerBlock
    let parent = outerBlock.parentElement
    while (parent) {
        if (!parent.classList.contains("callout")) {
            return
        }

        const collapsed = parent.classList.contains("is-collapsed")
        const height = collapsed ? parent.scrollHeight : parent.scrollHeight + current.scrollHeight
        parent.style.maxHeight = height + "px"

        current = parent
        parent = parent.parentElement
    }
}

function setupCallout() {
    const collapsible = document.getElementsByClassName(
        `callout is-collapsible`,
    ) as HTMLCollectionOf<HTMLElement>
    for (const div of collapsible) {
        const title = div.firstElementChild

        if (title) {
            title.addEventListener("click", toggleCallout)
            window.addCleanup(() => title.removeEventListener("click", toggleCallout))

            const collapsed = div.classList.contains("is-collapsed")
            const height = collapsed ? title.scrollHeight : div.scrollHeight
            div.style.maxHeight = height + "px"
        }
    }
}

function addHolonetCallout() {
    document.querySelectorAll<HTMLElement>(
        '.callout[data-callout="holonet"] .callout-title-inner',
    ).forEach((title) => {
        if (title.querySelector(".holonet-flair")) return

        const flair = document.createElement("span")
        flair.className = "holonet-flair"

        const now = new Date()
        flair.textContent =
            `Download to datapad completed :: ${now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            })}`

        title.appendChild(flair)
    })
}

function addIntelCallout() {
    document.querySelectorAll<HTMLElement>(
        '.callout[data-callout="intel"] .callout-title-inner',
    ).forEach((title) => {
        if (title.querySelector(".intel-flair")) return

        const flair = document.createElement("span")
        flair.className = "intel-flair"
        flair.textContent = "TOP SECRET :: CLASSIFIED // LEVEL 3 :: ACCESS GRANTED UNDER OPERATION PATHMAKER"

        title.appendChild(flair)
    })
}

document.addEventListener("nav", addHolonetCallout)
document.addEventListener("nav", addIntelCallout)
document.addEventListener("nav", setupCallout)
window.addEventListener("resize", setupCallout)
