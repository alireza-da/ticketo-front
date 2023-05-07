<script>
import Navbar from '../components/Navbar.vue'
export default {
    components: {
        Navbar
    },
    methods: {
        changeLang(lang){
            this.$emit('change-lang', lang)
        }
    },
    props:{
        lang: Object,
        selectedLang: String
    }
}
</script>


<template>
    <div class="h-full w-full">
        <Navbar v-on:change-lang="changeLang" :lang="lang" :selectedLang="selectedLang"></Navbar>
        <div class="card w-full h-5/6 bg-base-100 shadow-xl mt-5 ">
            <div class="card-body">
                <h2 class="card-title">Help</h2>
                <p>Systems: A platform for you to be in touch with your customers/sales</p>
                <p>Roles: Each user has her own roles which will be recognized by them. Roles with level higher than 10 or Update Ticket access can be considered as Ticket responders.</p>
                <p>If you have any question feel free to ask alirezadavoodi1378@gmail.com</p>
                <p>All Rights Reserved</p>
                <div class="card-actions justify-end">
                    <button class="btn btn-primary" @click="this.$router.push('/dashboard')">Dashboard</button>
                </div>
            </div>
        </div>
    </div>
</template>