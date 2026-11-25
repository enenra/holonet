
document.documentElement.setAttribute("saved-theme", "dark")

const emitThemeChangeEvent = () => {
    const event: CustomEventMap["themechange"] = new CustomEvent("themechange", {
        detail: { theme: "dark" },
    })
    document.dispatchEvent(event)
}

document.addEventListener("nav", () => {
    // Keep dark mode enforced after Quartz navigation.
    document.documentElement.setAttribute("saved-theme", "dark")
    emitThemeChangeEvent()
})
