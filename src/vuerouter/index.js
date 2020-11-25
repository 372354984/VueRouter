let _Vue = null;

export default class VueRouter {
    static install(Vue) {
        // 1、判断当前插件是否已经安装
        if (VueRouter.install.installed) {
            return;
        }
        VueRouter.install.installed = true;  //installed 标记插件已安装
        // 2、Vue构造函数记录到全局变量中 后续还需要vue.compent 处理 vue=link 和 vue-router
        _Vue = Vue;

        // 3、把创建Vue实例时候传入的router对象 注入到Vue实例上 this.$router
        // Vue.use 必须在 Vue实例化之前调用，所以执行 install时候 _Vue实例还没有生成
        _Vue.mixin({  // 我们可以用mixin 混入，在执行 beforeCreate 时候再注入 
            beforeCreate() {
                if (this.$options.router) { //mixin是全局的，保证只初始化一次，可以通过判断Vue实例上是否有router( main.js文件中 new 的 Vue实例)，避免后续组件注册重复执行   
                    _Vue.prototype.$router = this.$options.router;
                    this.$options.router.init();
                }
            }
        });
    }

    constructor(options) {
        this.options = options;
        this.routeMap = {};
        this.data = _Vue.observable({    //使用 Vue.observable 生成可响应对象 data
            current: "/"
        });
    }
    init() {
        this.createRouteMap();
        this.initComponents(_Vue);
        this.initEvent()
    }
    createRouteMap() {
        // 遍历所有的路由规则，把路由规则解析成键值对的形式 存储到routeMap
        this.options.routes.forEach(route => {
            this.routeMap[route.path] = route.component;
        });
    }
    initComponents(Vue) {
        //传入Vue构造函数，减少方法和外部的依赖
        Vue.component("router-link", {
            props: {
                to: String
            },
            // template: "<a :href='to'><slot></slot></a>"  // template 需要使用带编译器版本Vue
            render(h) {
                return h('a', {
                    attrs: {
                        href: this.to
                    },
                    on: {
                        click: this.clickHandler
                    },
                }, [this.$slots.default])
            },
            methods: {
                clickHandler(e) {
                    history.pushState({}, '', this.to) // 向当前浏览器会话的历史堆栈中添加一个状态（state）
                    this.$router.data.current = this.to // 记录当前路由地址
                    e.preventDefault()   // 阻止浏览器默认行为
                }
            }
        });
        const self = this;
        Vue.component('router-view', {
            render(h) {
                const component = self.routeMap[self.data.current]
                return h(component) // router-view占位替换为对应的组件
            }
        })
    }
    initEvent() {
        window.addEventListener('popstate', () => {
            this.data.current = window.location.pathname  // current 是响应式的,router-view更新
        })
    }
}
