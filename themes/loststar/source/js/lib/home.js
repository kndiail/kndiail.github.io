mixins.home = {
    mounted() {
        let background = this.$refs.homeBackground;
        let images = background.dataset.images.split(",");
        let id = Math.floor(Math.random() * images.length);
        // On small screens prefer a lighter background image (if provided).
        let useMobile = false;
        try {
            useMobile = window.matchMedia("(max-width: 768px)").matches;
        } catch (e) {}
        let picked = images[id];
        if (useMobile) {
            let mobile = images.find((src) => /mobile/i.test(src));
            if (mobile) picked = mobile;
        }
        background.style.backgroundImage = `url('${picked}')`;
        this.menuColor = true;
    },
    methods: {
        homeClick() {
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
        },
    },
};
