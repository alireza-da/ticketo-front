<script>


import { RouterLink } from "vue-router";

// eslint-disable-next-line no-undef
import axios from 'axios';
import { decodeCredential, googleAuthCodeLogin, googleTokenLogin } from 'vue3-google-login'
// import { OAuth2Client } from "google-Auth-library"
// const client = new OAuth2Client()

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Login",
    components: { RouterLink },
    data() {
        return {
            email: "",
            name: "",
            password: "",
            userData: "",
            confPassword: "",
            discord: "",
            steam: "",
            pfp: "",
            pfpRes: null,
            system: null,
            // APIs
            googleAuthTokenAPI: 'http://127.0.0.1:8000/api/ata/google/',
            googleAccesTokenAPI: 'https://www.googleapis.com/oauth2/v3/userinfo?access_token=',
            discordAuthTokenAPI: 'http://127.0.0.1:8000/api/ata/discord/',
            steamAuthTokenAPI: 'http://127.0.0.1:8000/api/ata/steam/',
            createUserAPI: 'http://127.0.0.1:8000/api/users/create/',
            roleListAPI: "http://127.0.0.1:8000/api/roles/list/", 
            sysListAPI: "http://127.0.0.1:8000/api/systems/list/",
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
                    })
                }
            })


        },
        login() {
            axios.post(`${this.createUserAPI}`, {

                "email": this.email,
                "password": this.password,
                "pfp": this.pfp,
                "discord_id": this.discord,
                "steam_hex": this.steam,
                "name": this.name

            }, {
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'multipart/form-data', },
            }).then((response) => {

                axios.post('http://127.0.0.1:8000/api/ata/', {

                    "username": this.email,
                    "password": this.password

                }, {
                    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', },
                }).then((response) => {
                    localStorage.setItem('token', response.data.token)
                    this.$router.push('/dashboard')
                })





                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "Your profile has been created successfuly"
                }, 2000) // 2s
            }).catch(error => {
                this.$notify({
                    group: "error",
                    title: "Error",
                    text: "Authentication failed. Check username & password"
                }, 2000) // 2s
            })
        },
        updatePfp(event) {
            this.pfp = event.target.files[0]

            var reader = new FileReader();
            this.pfpRes = event.target.result;
            reader.onload = function (event) {

            };

            reader.readAsDataURL(this.pfp);
            console.log(this.pfp);
        },
    }
}

</script>

<template>
    <div class="hero min-h-screen" style="background: none">
        <div class="hero-content flex-col lg:flex-row-reverse">

            <div class="card  flex-shrink-0 max-w-sm shadow-2xl bg-base-100">
                <div class="card-body">
                    <div class="form-control">
                        <label class="label justify-start">
                            <i class='bx bxs-user-pin mr-2'></i><span class="label-text">Name</span>
                        </label>
                        <input type="text" placeholder="John Doe" class="input input-bordered" v-model="name" />
                        <label class="label justify-start">
                            <i class='bx bxl-gmail mr-2'></i><span class="label-text">Email</span>
                        </label>
                        <input type="text" placeholder="sample@test.com" class="input input-bordered" v-model="email"  required/>
                        <label class="label justify-start">
                            <i class='bx bxl-steam mr-2'></i><span class="label-text">Steam Hex</span>
                        </label>
                        <input type="text" placeholder="steam:123abc456" class="input input-bordered" v-model="steam" required/>
                        <label class="label justify-start">
                            <i class='bx bxl-discord-alt mr-2'></i><span class="label-text">Discord ID</span>
                        </label>
                        <input type="text" placeholder="1234567890" class="input input-bordered" v-model="discord" required/>
                    </div>
                    <div class="form-control">
                        <label class="label justify-start">
                            <i class='bx bx-key mr-2'></i><span class="label-text">Password</span>
                        </label>
                        <input type="password" placeholder="password" class="input input-bordered" v-model="password" required/>

                    </div>
                    <div class="form-control">
                        <label class="label justify-start">
                            <i class='bx bx-key mr-2'></i><span class="label-text">Confrim Password</span><span
                                v-if="confPassword != password" class="text-red text-sm ml-2">Password does not match</span>
                        </label>
                        <input v-model="confPassword" class="input input-bordered" placeholder="password" type="password" required/>

                    </div>
                    <label class="label justify-start">
                        <i class='bx bxs-user-pin mr-2'></i>
                        <span class="label-text">Profile Picture</span>
                    </label>
                    <div class="avatar">
                        <!-- <div class="w-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img v-if="this.pfp !== ''" :src="this.pfpRes" ref="previewPfp" />
                            <img v-if="this.pfp === ''" src="../assets/3f9470b34a8e3f526dbdb022f9f19cf7.jpg" />
                        </div> -->
                        <input type="file" class="file-input file-input-bordered file-input-primary w-full max-w-xs"
                            v-on:change="updatePfp" />
                    </div>
                    <div class="form-control mt-6">
                        <button class="btn btn-primary" @click="login">Sign up</button>

                        <label class="label">
                            <router-link to="/login" class="label-text-alt link link-hover">Already have an account?
                                Login</router-link>



                        </label>

                    </div>


                </div>
            </div>
        </div>
    </div>
</template>
