<template>
    <div class="hero h-full bg-base-200 place-items-start justify-items-center">
        <div class="hero-content  flex flex-col justify-content-start place-content-around ">
            <div class="">
                <div class="avatar grid">
                    <div class="w-3x4 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 box-border h-64 w-64">
                        <img :src="pfp" ref="pfpImg " />
                    </div>
                    <input class="file-input file-input-bordered file-input-xs w-full max-w-xs mt-5" type="file" ref="file"
                        @change="readFile()" />

                </div>


            </div>
            <div class="divider"></div>
            <div class="flex flex-col place-content-between ">
                <h1 class="text-5xl font-bold place-self-center"> {{lang[selectedLang].editinfo}}</h1>

                <label class="label mt-4 justify-center" >
                    <i class='bx bxs-user-pin mr-2 text-2xl'></i>
                    <span class="label-text text-2xl w-full"> {{lang[selectedLang].name}}</span>


                    <input v-model="name" class="input input-bordered ml-3 w-full" placeholder="" type="text" /> </label>

                <label class="label justify-center mt-4">

                    <i class='bx bxl-gmail mr-2 text-2xl'></i>
                    <span class="label-text text-2xl w-full"> {{lang[selectedLang].email}}</span>


                    <input v-model="email" class="input input-bordered ml-3 w-full" placeholder="" type="text" /> </label>
                <label class="label justify-center mt-4">

                    <i class='bx bxl-steam mr-2 text-2xl'></i>
                    <span class="label-text text-2xl w-full"> {{lang[selectedLang].steamhex}}</span>

                    <input v-model="steamHex" class="input input-bordered ml-3 w-full" placeholder="" type="text" /> </label>
                <label class="label justify-start mt-4">
                    <i class='bx bxl-discord-alt mr-2 text-2xl'></i>
                    <span class="label-text text-2xl w-full"> {{lang[selectedLang].discordid}}</span>
                    <input v-model="discordId" class="input input-bordered ml-3 w-full" placeholder="" type="text" /> </label>

                <div class=" place-items-end  grid grid-cols-2 mt-5 ">

                    <button class="btn btn-outline w-full mr-2" @click="selectTab"> {{lang[selectedLang].cancel}}</button>

                    <button class="btn btn-outline btn-primary w-full ml-2" @click="updateUser"> {{lang[selectedLang].save}}</button>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    name: "EditProfile",
    props: {
        step: Number,
        lang: Object,
        selectedLang: String
    },
    data() {
        return {

            userAPI: "http://127.0.0.1:8000/api/users/details/ata/",
            createUserAPI: null,
            name: null,
            email: null,
            steamHex: null,
            discordId: null,
            token: null,
            userData: null,
            pfp: null,
            newPfp: null
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
        this.createUserAPI = `http://127.0.0.1:8000/api/users/details/${this.userData.id}`
        this.pfp = 'http://127.0.0.1:8000' + this.userData.pfp


    },
    methods: {
        readFile() {
            this.newPfp = this.$refs.file.files[0];
            if (FileReader && this.newPfp) {
                var fr = new FileReader();
                var img = this.$refs.pfpImg
                fr.onload = function () {
                    img.src = fr.result;
                }            
                fr.readAsDataURL(this.newPfp);
                this.$forceUpdate()
                // this.pfp = 'src/assets/Icons/' + this.newPfp.name
            }
        },
        async fetchUserData() {
            await axios.get(`${this.userAPI}`, { headers: { 'Authorization': `Token ${this.token}` } }).then((response) => {
                this.userData = response.data
            })
        },
        updateUser() {
            axios.put(`${this.createUserAPI}`, {

                "email": this.email,
                "pfp": this.newPfp,
                "discord_id": this.discordId,
                "steam_hex": this.steamHex,
                "name": this.name,
                "is_staff": this.userData.is_staff

            }, {
                headers: { "Authorization": `Token ${this.token}`, "Content-Type": "multipart/form-data" }
            }).then((response) => {

                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "Your profile has been updated successfuly"
                }, 2000) // 2s
                this.$emit('selectTab', 0)
            }).catch(error => {
                this.$notify({
                    group: "error",
                    title: "Error",
                    text: "Authentication failed."
                }, 2000) // 2s
            })
            

        },
        selectTab() {
            this.$emit('selectTab', 0)
        }
    }
}
</script>

<style scoped></style>