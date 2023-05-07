<script>

import axios from 'axios'

export default {
    async created() {
        console.log(this.$route.query);
        this.steamUrl = this.$route.query['openid.claimed_id'];
        this.steamID = BigInt(this.steamUrl.split('/')[5])
        this.steamHex = this.steamID.toString(16)
        if(this.steamHex)
            await this.login()
    },
    data() {
        return {
            steamID: 0,
            steamUrl: "",
            steamHex: "",
            // APIs 
            steamTokenAPI: 'https://62.3.14.249/api/ata/steam/'
        }

    },
    methods: {
        async login() {
            await axios.post(`${this.steamTokenAPI}`, {
                steam_hex: this.steamHex
            }).then(res => {
                this.$notify({
                    group: 'foo',
                    title: 'Success',
                    text: 'Logged In via Steam'
                })
                localStorage.setItem('token', res.data.token)
                this.$router.push('/dashboard')
            })
        },
        toHex(str) {
            var result = '';
            for (var i = 0; i < str.length; i++) {
                result += str.charCodeAt(i).toString(16);
            }
            return result;
        }
    }
}
</script>

<template>
    <div class="h-full w-full grid">
        <div class="card w-200 h-50 bg-primary text-primary-content place-self-center">
            <div class="card-body">
                <h2 class="card-title"><i class='bx bxl-steam'></i>You are authenticated with steam</h2>
                <p>Wait for our system to complete your authentication. Thanks for your patience</p>
                <p>Steam ID {{ steamID }}</p>
                <p>Steam Hex {{ steamHex }}</p>
                <p>Steam URL <a class="link link-accent">{{ steamUrl }}</a></p>
            </div>
        </div>
    </div>
</template>