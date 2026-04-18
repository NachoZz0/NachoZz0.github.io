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
    },
    mounted() {
        window.addEventListener("scroll", this.handleScroll, true);
        this.handleScroll();
        this.render();
    },
    methods: {
        render() {
            for (let i of this.renderers) i();
        },
        handleScroll() {
            let wrap = this.$refs.homePostsWrap;
            let newScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            let scrollingDown = newScrollTop > this.scrollTop;

            if (scrollingDown && newScrollTop > 90) {
                this.hiddenMenu = true;
                this.showMenuItems = false;
            } else {
                this.hiddenMenu = false;
            }

            if (wrap) {
                this.menuColor = newScrollTop <= window.innerHeight - 100;
                if (newScrollTop <= 400) wrap.style.top = "-" + newScrollTop / 5 + "px";
                else wrap.style.top = "-80px";
            } else {
                this.menuColor = false;
            }

            this.scrollTop = newScrollTop;
        },
    },
});
app.mount("#layout");
