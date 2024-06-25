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
            discordTokenAPI: 'https://ticketoapi.liara.run/api/ata/discord/',
            discordOfficialEndpointAPI: 'https://discord.com/api/v10/',
            discordTokenEndpoint: 'oauth2/token',
            redirectUri: 'https://ticketo.liara.run/auth/discord',
            sysListAPI: "https://ticketoapi.liara.run/api/systems/list/", // roles/details/<int:sysid>/<int:uid>,
            createUserAPI: 'https://ticketoapi.liara.run/api/users/create/',
            roleListAPI: "https://ticketoapi.liara.run/api/roles/list/", // roles/details/<int:sysid>/<int:uid>,
        }

    },
    methods: {
        async login() {
            const code = this.code
            await axios.post(`${this.discordOfficialEndpointAPI}${this.discordTokenEndpoint}`, new URLSearchParams({
                client_id: this.clientID,
                client_secret: this.clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
                scope: 'identify',
            }).toString(), { headers: { "Content-Type": 'application/x-www-form-urlencoded' } }).then(async res => {
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
                                group: 'foo',
                                title: 'Info',
                                text: 'Creating account'
                            })
                            
                            // sign up with discord id
                            axios.post(`${this.createUserAPI}`, {
                                "name": this.discordUsername,
                                "discord_id": this.discordId
                            }, {
                                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'multipart/form-data', },
                            }).then((response) => {
                                axios.post('https://ticketoapi.liara.run/api/ata/discord/', {
                                    discord_id: this.discordId
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
                                    text: "Your Discord profile has been created successfuly"
                                }, 2000) // 2s
                            }).catch(error => {
                                this.$notify({
                                    group: "error",
                                    title: "Error",
                                    text: "Authentication failed. Check username & password"
                                }, 2000) // 2s
                            })
                        }
                    })
                })
            })
        },
        async fetchSystems() {
            await axios.get(`${this.sysListAPI}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.systems = res.data
            })
            this.$emit('fetch-system')
        },
        toHex(str) {
            var result = '';
            for (var i = 0; i < str.length; i++) {
                result += str.charCodeAt(i).toString(16);
            }
            return result;
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