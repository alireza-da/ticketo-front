<script>


import { RouterLink } from "vue-router";


import axios from 'axios';
import { decodeCredential, googleAuthCodeLogin, googleTokenLogin } from 'vue3-google-login'


export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Login",
    components: { RouterLink },
    props: {
        lang: Object,
        selectedLang: String
    },
    data() {
        return {
            email: "",
            password: "",
            userData: "",
            confPassword: "",
            discord: "",
            steam: "",
            systems: null,
            token: "",
            // APIs
            googleAuthTokenAPI: 'https://ticketoapi.liara.run/api/ata/google/',
            googleAccesTokenAPI: 'https://www.googleapis.com/oauth2/v3/userinfo?access_token=',
            discordAuthTokenAPI: 'https://ticketoapi.liara.run/api/ata/discord/',
            steamAuthTokenAPI: 'https://ticketoapi.liara.run/api/ata/steam/',
            discordOauth2API: 'https://discord.com/oauth2/authorize?client_id=1100826836516229191&response_type=code&redirect_uri=https%3A%2F%2Fticketo.liara.run%2Fauth%2Fdiscord&scope=email+identify',
            createUserAPI: 'https://ticketoapi.liara.run/api/users/create/',
            roleListAPI: "https://ticketoapi.liara.run/api/roles/list/", // roles/details/<int:sysid>/<int:uid>,
            sysListAPI: "https://ticketoapi.liara.run/api/systems/list/", // roles/details/<int:sysid>/<int:uid>,
        }
    },
    methods: {
        async googleLogin(response) {
            console.log(response);
            this.userData = decodeCredential(response.credential)
            if (this.userData.email_verified) {
                await axios.post(`${this.googleAuthTokenAPI}`, { 'username': this.userData.email }).then(res => {
                    this.$router.push('/dashboard')
                })
            }

        },
        async googleLoginToken() {
            googleTokenLogin().then(async response => {
                console.log(response.access_token);
                await axios.get(`${this.googleAccesTokenAPI}${response.access_token}`).then(res => {
                    console.log(res.data);
                    this.userData = res.data
                })

                if (this.userData.email_verified) {
                    await axios.post(`${this.googleAuthTokenAPI}`, { 'username': this.userData.email }).then(res => {
                        this.$router.push('/dashboard')
                        this.$notify({
                            group: "foo",
                            title: "Success",
                            text: "Logged in via Gmail"
                        })
                        localStorage.setItem('token', res.data.token)
                    }).catch(error => {
                        this.$notify({
                            group: "error",
                            title: "Error",
                            text: "Authentication failed. Your gmail not registered"
                        }, 2000) // 2s
                    });
                }
            })


        },


        async fetchSystems() {
            await axios.get(`${this.sysListAPI}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.systems = res.data
            })
            this.$emit('fetch-system')
        },

        login() {
            axios.post('https://ticketoapi.liara.run/api/ata/', {

                "username": this.email,
                "password": this.password

            }, {
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', },
            }).then((response) => {
                localStorage.setItem('token', response.data.token)

                this.token = response.data.token
                this.$router.push('/dashboard')
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "You are logged in"
                }, 2000) // 2s
            }).catch(error => {
                this.$notify({
                    group: "error",
                    title: "Error",
                    text: "Authentication failed. Check username & password"
                }, 2000) // 2s
            })
        },
        async createGuestRole(uid) {
            for (const system of this.systems) {
                await axios.post(`${this.roleListAPI}`, {
                    "color": "#000000",
                    "create_ticket": true,
                    "delete_messages": false,
                    "delete_ticket": false,
                    "level": 0,
                    "manage_members": false,
                    "manage_role": false,
                    "manage_system": false,
                    "name": "Guest",
                    "owner": false,
                    "read_history": true,
                    "read_messages": true,
                    "sys_id": system.id,
                    "update_ticket": false,
                    "upload_media": true,
                    "user_id": uid,
                    "write_messages": true
                }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {

                })
            }

        },
        loginasguest() {
            const gi = this.makeid(20)
            axios.post(`${this.createUserAPI}`, {
                "name": "Guest",
                "guest_identifier": gi
            }, {
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'multipart/form-data', },
            }).then((response) => {

                axios.post('https://ticketoapi.liara.run/api/ata/guest/', {
                    guest_identifier: gi
                }, {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                }).then(async (response) => {
                    localStorage.setItem('token', response.data.token)
                    this.token = response.data.token
                    await this.fetchSystems()
                    await this.createGuestRole(response.data.user_id)
                    this.$router.push('/dashboard')
                })
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "Your discord profile has been fetched successfuly"
                }, 2000) // 2s
            }).catch(error => {
                this.$notify({
                    group: "error",
                    title: "Error",
                    text: "Authentication failed. Check username & password"
                }, 2000) // 2s
            })
        },
        makeid(length) {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            let counter = 0;
            while (counter < length) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
                counter += 1;
            }
            return result;
        },
    },
    async created() {
        // await this.fetchSystems()
    }
}

</script>


<template>
    <div class="hero min-h-screen " style="background: none">
        <div class="hero-content flex-col lg:flex-row-reverse">

            <div class="card  flex-shrink-0 w-10/5 max-w-sm shadow-2xl bg-base-100">
                <div class="card-body ">
                    <div class="form-control">
                        <label class="label justify-start">
                            <i class='bx bxl-gmail mr-2'></i><span class="label-text">{{ lang[selectedLang].email
                                }}</span>
                        </label>
                        <input v-model="email" class="input input-bordered" placeholder="email" type="email" />
                    </div>
                    <div class="form-control">
                        <label class="label justify-start">
                            <i class='bx bx-key mr-2'></i><span class="label-text">{{ lang[selectedLang].password
                                }}</span>
                        </label>
                        <input v-model="password" class="input input-bordered" placeholder="password" type="password" />

                    </div>


                    <div class="form-control mt-6">
                        <button class="btn btn-primary" @click="login()">{{ lang[selectedLang].login }}</button>

                        <label class="label">
                            <router-link class="label-text-alt link link-hover" to="/forgetpassword">Forgot password?
                            </router-link>


                            <router-link class="label-text-alt link link-hover" to="/signup">Sign up</router-link>
                        </label>
                        <div class="divider">OR</div>
                        <a class="btn w-full" @click="loginasguest()">{{ lang[selectedLang].logingasguest }}<i
                                class='bx bxl-discord-alt ml-2'></i></a>
                        <div class="divider">OR</div>
                        <div class="flex justify-around" style="padding-top: 10px">
                            <button class="btn btn-circle justify-center" @click="googleLoginToken"><img
                                    src="../assets/Icons/google.png">
                            </button>

                            <form action="https://steamcommunity.com/openid/login" method="post">
                                <input type="hidden" name="openid.identity"
                                    value="http://specs.openid.net/auth/2.0/identifier_select" />
                                <input type="hidden" name="openid.claimed_id"
                                    value="http://specs.openid.net/auth/2.0/identifier_select" />
                                <input type="hidden" name="openid.ns" value="http://specs.openid.net/auth/2.0" />
                                <input type="hidden" name="openid.mode" value="checkid_setup" />
                                <input type="hidden" name="openid.realm" value="https://ticketo.liara.run/auth/steam" />
                                <input type="hidden" name="openid.return_to"
                                    value="https://ticketo.liara.run/auth/steam" />
                                <button class="btn btn-circle justify-center"><img
                                        src="../assets/Icons/steam.png"></button>
                            </form>
                            <a class="btn btn-circle justify-center" :href='discordOauth2API'><img
                                    src="../assets/Icons/discord.png">
                            </a>


                        </div>




                    </div>


                </div>
            </div>
        </div>
    </div>
</template>
