import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
    // start progress bar
    NProgress.start()

    // determine whether the user has logged in
    const hasToken = getToken()
    if (hasToken) {
        if (to.path === '/login') {
            // if is logged in, redirect to the home page
            // next({ path: '/appMainIndex' })
            next()
            console.log(1234);
            NProgress.done()
        } else {
            // determine whether the user has obtained his permission roles through getInfo
            const hasRoles = store.getters.roles && store.getters.roles.length > 0
            if (hasRoles) {
                console.log(hasRoles);
                console.log(5);
                next()
            } else {
                try {
                    // get user info
                    // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
                    const { roles } = await store.dispatch('GetInfo')

                    // generate accessible routes map based on roles
                    const accessRoutes = await store.dispatch('permission/generateRoutes', roles)

                    // dynamically add accessible routes

                    // router.addRoutes(accessRoutes)
                    console.log(6);

                    next({...to, replace: true })
                } catch (error) {
                    // remove token and go to login page to re-login
                    await store.dispatch('FedLogOut')
                    Message.error(error || 'Has Error')
                        //以前写法（19级）
                        // next(`/login?redirect=${to.path}`)
                        // next(to.path)
                    console.log(error);
                    NProgress.done()
                }
            }
        }
    } else {
        /* has no token*/
        if (whiteList.indexOf(to.path) !== -1) {
            // in the free login whitelist, go directly
            next()
        } else {
            // other pages that do not have permission to access are redirected to the login page.
            // next(to.path)
            next()
            NProgress.done()
        }
    }
})

router.afterEach(() => {
    // finish progress bar
    NProgress.done()
})