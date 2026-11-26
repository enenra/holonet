import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
    configuration: {
        pageTitle: "HOLONET DATA TERMINAL",
        pageTitleSuffix: "",
        enableSPA: true,
        enablePopovers: true,
        analytics: {
            provider: "plausible",
        },
        locale: "en-US",
        baseUrl: "enenra.github.io/holonet",
        ignorePatterns: ["private", "templates", ".obsidian"],
        defaultDateType: "created",
        theme: {
            fontOrigin: "googleFonts",
            cdnCaching: true,
            typography: {
                header: "Saira",
                body: "Inter",
                code: "Fira Code",
            },
            colors: {
                lightMode: {
                    light: "#f5f5f5",
                    lightgray: "#e5e5e5",
                    gray: "#b8b8b8",
                    darkgray: "#333333",
                    dark: "#222222",
                    secondary: "#284b45",
                    tertiary: "#52796f",
                    highlight: "#dcebe5",
                    textHighlight: "#b3d9c9",
                },
                darkMode: {
                    light: "#0e1a18",
                    lightgray: "#172522",
                    gray: "#52665f",
                    darkgray: "#7b968f",
                    dark: "#d4d4d4",
                    secondary: "#708c85",
                    tertiary: "#9e9e9e",
                    highlight: "#263c35",
                    textHighlight: "#d4d4d4",
                },
            },
        },
    },
    plugins: {
        transformers: [
            Plugin.FrontMatter(),
            Plugin.CreatedModifiedDate({
                priority: ["frontmatter", "filesystem"],
            }),
            Plugin.SyntaxHighlighting({
                theme: {
                    light: "github-light",
                    dark: "github-dark",
                },
                keepBackground: false,
            }),
            Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
            Plugin.GitHubFlavoredMarkdown(),
            Plugin.TableOfContents(),
            Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
            Plugin.Description(),
            Plugin.Latex({ renderEngine: "katex" }),
        ],
        filters: [
            Plugin.RemoveDrafts(),
            Plugin.ExcludeUnpublished(),
        ],
        emitters: [
            Plugin.AliasRedirects(),
            Plugin.ComponentResources(),
            Plugin.ContentPage(),
            Plugin.FolderPage(),
            Plugin.TagPage(),
            Plugin.ContentIndex({
                enableSiteMap: true,
                enableRSS: true,
            }),
            Plugin.Assets(),
            Plugin.Static(),
            Plugin.NotFoundPage(),
        ],
    },
}

export default config
