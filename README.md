# VueRouter  基础功能手写 实现

类图 

[![Daljz9.md.png](https://s3.ax1x.com/2020/11/25/Daljz9.md.png)](https://imgchr.com/i/Daljz9)



### 代码实现

#### 实现 install 方法

1. 判断当前插件是否已经安装
2. 把Vue构造函数记录到全局变量（后续初始化 router-link router-view 组件还需要Vue构造函数）
3. 把创建Vue实例时候传入的 router 对象注入到Vue实例上

``` javascript
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
                }
            }
        });
    }
}
```

#### 初始化构造函数

```javascript
    constructor(options) {
        this.options = options;
        this.routeMap = {};
        this.data = _Vue.observable({    //使用 Vue.observable 生成可响应对象 data
            current: "/"
        });
    }
```

#### 创建 routeMap

```javascript
    createRouteMap() {
        // 遍历所有的路由规则，把路由规则解析成键值对的形式 存储到routeMap
        this.options.routes.forEach(route => {
            this.routeMap[route.path] = route.component;
        });
    }
```
#### 创建和注册全局组件 router-link 和 router-view

```javascript
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
```
#### 监听浏览器前进后退操作

```javascript
 initEvent() {
        window.addEventListener('popstate', () => {
            this.data.current = window.location.pathname  // current 是响应式的,router-view更新
        })
    }
```

#### 完整代码代码

最后在注册时候，调用初始化方法，完成基本 VueRouter history模式模拟

```javascript
let _Vue = null;

export default class VueRouter {   
    static install(Vue) {
        if (VueRouter.install.installed) {
            return;
        }
        VueRouter.install.installed = true;
        _Vue = Vue;
        _Vue.mixin({
            beforeCreate() {
                if (this.$options.router) {
                    _Vue.prototype.$router = this.$options.router;
                    this.$options.router.init();
                }
            }
        });
    }
    constructor(options) {
        this.options = options;
        this.routeMap = {};
        this.data = _Vue.observable({
            current: "/"
        });
    }
    init() {
        this.createRouteMap();
        this.initComponents(_Vue);
        this.initEvent()
    }
    createRouteMap() {
        this.options.routes.forEach(route => {
            this.routeMap[route.path] = route.component;
        });
    }
    initComponents(Vue) {
        Vue.component("router-link", {
            props: {
                to: String
            },
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
                    history.pushState({}, '', this.to)
                    this.$router.data.current = this.to
                    e.preventDefault()
                }
            }
        });
        const self = this;
        Vue.component('router-view', {
            render(h) {
                const component = self.routeMap[self.data.current]
                console.log(component)
                return h(component)
            }
        })
    }
    initEvent() {
        window.addEventListener('popstate', () => {
            this.data.current = window.location.pathname
        })
    }
}

```

