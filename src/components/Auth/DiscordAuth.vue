<script>

import axios from 'axios'

export default {
    async created() {
        this.code = this.$route.query.code
        if (this.code)
            await this.login()
    },
    data() {
        return {
            code: '',
            clientID: '1100826836516229191',
            clientSecret: "yaTLoib_uIFOG2RDcHTgsv45KmuSnkXj",
            accessToken: "",
            discordId: 0,
            discordUsername: "",
            // APIs 
            discordTokenAPI: 'https://ticket-backend.iran.liara.run/api/ata/discord/',
            discordOfficialEndpointAPI: 'https://discord.com/api/v10/',
            discordTokenEndpoint: 'oauth2/token',
            redirectUri: 'https://ticket-backend.iran.liara.run/auth/discord'
        }

    },
    methods: {
        async login() {
            const code = this.code
            console.log(new URLSearchParams({
                client_id: this.clientID,
                client_secret: this.client_secret,
                code: this.code,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
                scope: 'identify'

            }).toString());
            await axios.post(`${this.discordOfficialEndpointAPI}${this.discordTokenEndpoint}`, new URLSearchParams({
                client_id: this.clientID,
                client_secret: this.clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
                scope: 'identify',
            }).toString(), { headers: { "Content-Type": 'application/x-www-form-urlencoded' } }).then(async res => {
                console.log(res.data);
                await axios.get('https://discord.com/api/users/@me', {
                    headers: {
                        Authorization: `${res.data.token_type} ${res.data.access_token}`,
                    },
                }).then(async res => {
                    this.discordId = res.data.id
                    this.discordUsername = res.data.username
                    await axios.post(`${this.discordTokenAPI}`, {
                        discord_id: this.discordId
                    }).then(res => {
                        localStorage.setItem('token', res.data.token)
                        this.$notify({
                            group: 'foo',
                            title: 'Success',
                            text: 'Logged In via Discord'
                        })
                        this.$router.push('/dashboard')
                    }).catch(err => {
                        if (err.response.status === 404) {
                            this.$notify({
                                group: 'error',
                                title: 'Error',
                                text: 'User assigned with this discord does not exist'
                            })
                        }
                    })
                })
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
                <h2 class="card-title"><i class='bx bxl-discord-alt'></i>You are authenticated with Discord</h2>
                <p>Wait for our system to complete your authentication. Thanks for your patience</p>
                <p>Discord ID{{ discordId }}</p>
                <p>Discord Username {{ discordUsername }}</p>
            </div>
        </div>
    </div>
</template>