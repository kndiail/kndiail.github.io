const app = Vue.createApp({
    mixins: Object.values(mixins),
    data() {
        return {
            loading: true,
            hiddenMenu: false,
            showMenuItems: false,
            menuColor: false,
            scrollTop: 0,
            renderers: [],
        };
    },
    created() {
        window.addEventListener("load", () => {
            this.loading = false;
        });
        // Fallback: never keep the loading screen up forever (e.g. a slow
        // or blocked CDN resource can delay the window load event).
        setTimeout(() => {
            this.loading = false;
        }, 4000);
    },
    mounted() {
        window.addEventListener("scroll", this.handleScroll, true);
        this.render();
    },
    methods: {
        render() {
            for (let i of this.renderers) i();
        },
        handleScroll() {
            let wrap = this.$refs.homePostsWrap;
            let newScrollTop = document.documentElement.scrollTop;
            if (this.scrollTop < newScrollTop) {
                this.hiddenMenu = true;
                this.showMenuItems = false;
            } else this.hiddenMenu = false;
            if (wrap) {
                if (newScrollTop <= window.innerHeight - 100) this.menuColor = true;
                else this.menuColor = false;
                if (newScrollTop <= 400) wrap.style.top = "-" + newScrollTop / 5 + "px";
                else wrap.style.top = "-80px";
            }
            this.scrollTop = newScrollTop;
        },
    },
});
app.mount("#layout");

// Discord-like spoiler reveal behavior
(function initDiscordSpoiler() {
    function reveal(el) {
        if (!el || el.classList.contains("revealed")) return;
        el.classList.add("revealed");
        el.setAttribute("aria-expanded", "true");
    }

    document.addEventListener("click", (e) => {
        const t = e.target;
        if (t && t.classList && t.classList.contains("discord-spoiler")) {
            reveal(t);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const t = e.target;
        if (t && t.classList && t.classList.contains("discord-spoiler")) {
            e.preventDefault();
            reveal(t);
        }
    });
})();

// Reading progress bar
(function readingProgress() {
    const bar = document.getElementById("reading-progress");
    if (!bar) return;
    const update = () => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
        bar.style.width = pct + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
})();

// Chapter TOC toggle
(function chapterToc() {
    const toggle = document.querySelector(".chapter-toc-toggle");
    const list = document.querySelector(".chapter-toc-list");
    if (!toggle || !list) return;
    toggle.addEventListener("click", () => {
        list.classList.toggle("open");
        toggle.classList.toggle("open");
    });
})();

// Reader settings: font scale + line height, persisted in localStorage
(function readerSettings() {
    const FONT_KEY = "readerFontScale";
    const LH_KEY = "readerLineHeight";
    const FONT_STEPS = [0.85, 0.95, 1, 1.1, 1.2, 1.35, 1.5];
    const LH_STEPS = [1, 1.15, 1.3];
    const LH_NAMES = ["紧凑", "标准", "宽松"];

    function clampStep(steps, value, fallback) {
        const v = parseFloat(value);
        return steps.indexOf(v) !== -1 ? v : fallback;
    }
    function getFont() {
        return clampStep(FONT_STEPS, localStorage.getItem(FONT_KEY), 1);
    }
    function getLh() {
        return clampStep(LH_STEPS, localStorage.getItem(LH_KEY), 1);
    }
    function updateLabel() {
        const el = document.querySelector(".reader-value");
        if (!el) return;
        el.textContent =
            Math.round(getFont() * 100) + "% · " + LH_NAMES[LH_STEPS.indexOf(getLh())];
    }
    function apply() {
        const root = document.documentElement;
        root.style.setProperty("--reader-scale", getFont());
        root.style.setProperty("--reader-lh", getLh());
        updateLabel();
    }
    apply();

    document.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest && e.target.closest("[data-reader]");
        if (!btn) return;
        const action = btn.getAttribute("data-reader");
        if (action === "font-dec" || action === "font-inc") {
            const cur = getFont();
            const i = FONT_STEPS.indexOf(cur);
            const next = FONT_STEPS[Math.min(FONT_STEPS.length - 1, Math.max(0, i + (action === "font-inc" ? 1 : -1)))];
            localStorage.setItem(FONT_KEY, next);
        } else if (action === "line-height") {
            const cur = getLh();
            const next = LH_STEPS[(LH_STEPS.indexOf(cur) + 1) % LH_STEPS.length];
            localStorage.setItem(LH_KEY, next);
        } else if (action === "reset") {
            localStorage.removeItem(FONT_KEY);
            localStorage.removeItem(LH_KEY);
        } else {
            return;
        }
        apply();
    });
})();
