<script>

import axios from 'axios'

export default {
    setup() {

    },
    props: {
        lang: Object,
        selectedLang: String
    },
    data() {
        return {
            system: null,
            userData: null,
            refUrl: null,
            token: null,
            // APIs
            sysRefAPI: 'https://62.3.14.249/api/systems/details/referral/', //'<str:referral>/<int:uid>'
            userAPI: 'https://62.3.14.249/api/users/details/ata/'
        }
    },
    async created() {
        this.refUrl = this.$route.params.ref_url
        this.token = localStorage.getItem('token')
        await this.fetchUser()
        await this.fetchSystem()
        
    },
    methods: {
        async acceptRef() {
            await axios.get(`${this.sysRefAPI}${this.refUrl}/${this.userData.id}`, {headers: {Authorization: `Token ${this.token}`}}).then(res => {
                this.$notify({
                    group: 'foo',
                    title: 'Succes',
                    text: "You've joined the system"
                })
                this.$router.push('/dashboard')
            }).catch(err => {
                this.$notify({
                    group: 'error',
                    title: 'Error',
                    text: "Invalid Referral"
                }, 2500)
            })
        },
        goToDashboard(){
            this.$router.push('/dashboard')
        },
        async fetchSystem() {
            await axios.get(`${this.sysRefAPI}${this.refUrl}`, {headers: {Authorization: `Token ${this.token}`}}).then(res => {
                this.system = res.data
            }).catch(err => {
                if(err.response.status === 404){
                    this.$notify({
                    group: 'error',
                    title: 'Error',
                    text: "Invalid Referral"
                }, 2500)
                }
            })
        },
        async fetchUser(){
            await axios.get(`${this.userAPI}`, {headers: {Authorization: `Token ${this.token}`}}).then(res => {
                this.userData = res.data
            })
        }
    }
}
</script>



<template>
    <div class="h-full w-full grid">
        <div class="card w-200 h-50 bg-primary text-primary-content place-self-center" v-if="system">
            <div class="card-body">
                <h2 class="card-title"><i class='bx bxs-party'></i>{{lang[selectedLang].referraltitle}}</h2>
                <p>You are invited to join {{ system.name }} support system via referral url</p>
                <div class="card-actions justify-end">
                    <button class="btn " @click="acceptRef">Join</button>
                    <button class="btn " @click="this.$router.push('/dashboard')">Refuse</button>
                </div>
            </div>
        </div>
        <div class="card w-200 h-70 bg-primary text-primary-content place-self-center" v-if="!system">
            <div class="card-body">
                <h2 class="card-title">Invalid Referral URL</h2>
                <p>The referral you are using is either invalid or expired ask system managers for new one</p>
                <div class="card-actions justify-end">
                    <button class="btn " @click="goToDashboard">Dashboard</button>
                </div>
            </div>
        </div>
    </div>
</template>