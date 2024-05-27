import { createRouter, createWebHistory } from 'vue-router'
import Landing from '../views/Landing.vue'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import Signup from "@/views/Signup.vue"
import ForgetPassword from "@/views/ForgetPassword.vue"
import Systems from '../components/System/Systems.vue'
import System from '../components/System/System.vue'
import Referral from '../views/Referral.vue'
import SteamAtuh from '@/components/Auth/SteamAuth.vue'
import DiscordAuth from '@/components/Auth/DiscordAuth.vue'
import Help from '../views/Help.vue'

const routes = [
  {
    path: '/',
    redirect: '/landing'
  },
  {
    path: '/landing',
    name: 'landing',
    component: Landing
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/signup',
    name: 'signup',
    component: Signup
  },
  {
    path: '/forgetPassword',
    name: 'forgetPassword',
    component: ForgetPassword
  },
  {
    path: '/systems/:id',
    name: 'systems',
    component: System,
  },
  {
    path: '/referral/:ref_url',
    name: 'referral',
    component: Referral,
  },
  {
    path: '/Auth/steam/',
    name: 'steamAuth',
    component: SteamAtuh,
  },
  {
    path: '/Auth/discord/',
    name: 'discordAuth',
    component: DiscordAuth,
  },
  {
    path: '/help',
    name: 'help',
    component: Help,
  },
  {
    path: '/tickets/:ticketname/:ticketid',
    name: 'ticketpage',
    component: Dashboard
  }
  // {
  //   path: '/login',
  //   name: 'login',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    // component: function () {
    //   return import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
    // }
  // }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// export default router

