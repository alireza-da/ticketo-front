<script>
import axios from "axios";
import {ref} from "vue";
export default {
    props:{
        lang: Object,
        selectedLang: String
    },
    name: "ShowProfile",
    data() {
        return {
            token: null,
            userData: null,
            userAPI: "http://127.0.0.1:8000/api/users/details/ata/",
            name : null,
            email : null,
            steamHex : null,
            discordId : null,
            pfp : null,
        }
    },
    created() {
        this.token = localStorage.getItem('token')
    },
    async mounted() {
        await this.fetchUserData()
        this.name = this.userData.name
        this.email = this.userData.email
        this.steamHex = this.userData.steam_hex
        this.discordId = this.userData.discord_id
        this.pfp = 'http://127.0.0.1:8000'+this.userData.pfp

    },
    methods: {
        async fetchUserData() {
            await axios.get(`${this.userAPI}`, {headers: {'Authorization': `Token ${this.token}`}}).then((response) => {
                this.userData = response.data
            })
        },
        logout(){
            localStorage.clear()
            this.$router.push('/login')

        }
    }

}
</script>


<template>

    <div class="hero min-h-screen bg-base-200 place-items-start justify-items-center" >
        <div class="hero-content  flex flex-col justify-content-start " >
            <div class="avatar">
                <div class="w-54 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img :src="pfp"/>
                </div>
            </div>
            <div class="divider"></div>
            <div class="flex flex-col place-content-between justify-items-center" >
                <h1 class="text-5xl font-bold "> {{lang[selectedLang].yourinformation}}</h1>

                <label class="label justify-start mt-4">
                        <i class='bx bxs-user-pin mr-2 text-2xl'></i>
                        <span class="label-text text-2xl"> {{lang[selectedLang].name}}</span>


                    <p class="text-1xl m-3">{{name}}</p>
                </label>

                <label class="label justify-start mt-4">

                        <i class='bx bxl-gmail mr-2 text-2xl'></i>
                        <span class="label-text text-2xl"> {{lang[selectedLang].email}}</span>


                    <p class="text-1xl m-3">{{ email }}</p>
                </label>
                <label class="label justify-start mt-4">

                        <i class='bx bxl-steam mr-2 text-2xl'></i>
                        <span class="label-text text-2xl"> {{lang[selectedLang].steamhex}}</span>

                    <p class="text-1xl m-3">{{ steamHex }}</p>
                </label>
                <label class="label justify-start mt-4">
                    <i class='bx bxl-discord-alt mr-2 text-2xl'></i>
                    <span class="label-text text-2xl"> {{lang[selectedLang].discordid}}</span>
                    <p class="text-1xl m-3">{{discordId}}</p>
                </label>

                <button class="btn btn-outline btn-secondary w-full " @click="logout"> {{lang[selectedLang].signout}}</button>
            </div>
        </div>
    </div>

</template>


<style scoped>

</style>