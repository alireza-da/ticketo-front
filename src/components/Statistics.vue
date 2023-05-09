<script>
import axios from 'axios'
export default {
    props: {
        title: {
            type: String,
            default: 'Tab'
        },
        lang: Object,
        selectedLang: String
        // systemsData: {
        //     type: [],
        //     default: null
        // },
        // ticketsData: {
        //     type: [],
        //     default: null
        // },
        // userData: {
        //     type: Object,
        //     default: null
        // },
    },
    async created() {
        this.token = localStorage.getItem('token')
        // this.userData = this.$props.userData
        // this.systemsData = this.$props.systemsData
        // this.ticketsData = this.$props.ticketsData
        await this.fetchUserData()
        await this.fetchSystems()
        await this.fetchUserSystems()
        await this.fetchTickets()
        await this.fetchUserTickets()
    },
    data() {
        return {
            isActive: false,
            token: null,
            userData: {},
            systemsData: [],
            ticketsData: [],
            userTickets: [],
            allTickets: [],
            systems: [],
            // APIs
            systemsListAPI: 'https://ticket-backend.iran.liara.run/api/systems/list/',
            ticketsAPI: "https://ticket-backend.iran.liara.run/api/users/details/tickets/", // e.g https://ticket-backend.iran.liara.run/api/users/details/tickets/1
            ticketListAPI: 'https://ticket-backend.iran.liara.run/api/tickets/list/',
            userSystemsAPI: "https://ticket-backend.iran.liara.run/api/systems/details/user/", // e.g https://ticket-backend.iran.liara.run/api/systems/details/user/1
            userAPI: "https://ticket-backend.iran.liara.run/api/users/details/ata/", // e.g https://ticket-backend.iran.liara.run/api/users/details/1
            serverMediaAPI: 'https://ticket-backend.iran.liara.run', //path
        }
    },
    methods: {
        async fetchSystems(){
            await axios.get(`${this.systemsListAPI}`, {headers: {Authorization: `Token ${this.token}`}}).then(res =>{
                this.systems = res.data
            })
        },
        async fetchUserData() {
            await axios.get(`${this.userAPI}`, { headers: { 'Authorization': `Token ${this.token}` } }).then((response) => {
                this.userData = response.data
            })
        },
        async fetchUserSystems() {
            await axios.get(`${this.userSystemsAPI}${this.userData['id']}`, { headers: { 'Authorization': `Token ${this.token}` } }).then((response) => {
                this.systemsData = response.data
            })
        },
        async fetchTickets() {
            await axios.get(`${this.ticketsAPI}${this.userData['id']}`, { headers: { 'Authorization': `Token ${this.token}` } }).then((response) => {
                this.ticketsData = response.data
            })
        },
        getUserSystemsNumber(){
            return this.systemsData ? this.systemsData.length : 0
        },
        getTicketsNumber(){
            return this.ticketsData ? this.ticketsData.length : 0
        },
        getUserData(key){
            if(key === 'pfp'){
                return this.userData ? `${this.serverMediaAPI}${this.userData[key]}` : "../assets/3f9470b34a8e3f526dbdb022f9f19cf7.jpg"    
            }
            return this.userData ? this.userData[key] : ""
        },
        getUserTicketsNumber(){
            return this.userTickets ? this.userTickets.length : 0
        },
        async fetchUserTickets(){
            await axios.get(`${this.ticketsAPI}${this.userData.id}`, {headers: {Authorization: `Token ${this.token}`}}).then(res => {
                this.userTickets = res.data
            })
            await axios.get(`${this.ticketListAPI}`, {headers: {Authorization: `Token ${this.token}`}}).then(res => {
                this.allTickets = res.data
                
            })
        },
        getAllTicketsCount(){
            return this.allTickets ? this.allTickets.length : 0
        }
    }

}
</script>

<template>
    <div v-show="isActive" class="grid p-5">
        <div class="stats shadow mb-5">

            <div class="stat">
                <div class="stat-figure text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        class="inline-block w-8 h-8 stroke-current">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z">
                        </path>
                    </svg>
                </div>
                <div class="stat-title">{{lang[selectedLang].totalsystems}}</div>
                <div class="stat-value text-primary">{{ systems.length}}</div>
                <div class="stat-desc">21% more than last month</div>
            </div>

            <div class="stat">
                <div class="stat-figure text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        class="inline-block w-8 h-8 stroke-current">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
                <div class="stat-title">{{lang[selectedLang].yoursystems}}</div>
                <div class="stat-value text-secondary">{{ getUserSystemsNumber() }}</div>
                <div class="stat-desc">21% more than last month</div>
            </div>

            <div class="stat">
                <div class="stat-figure text-secondary">
                    <div class="avatar online">
                        <div class="w-16 rounded-full">
                            <img :src="getUserData('pfp')" />
                        </div>
                    </div>
                </div>
                <div class="stat-value">86%</div>
                <div class="stat-title">Profile Completion</div>
                <div class="stat-desc text-secondary">2 Field Remaining</div>
            </div>

        </div>
        <div class="stats bg-primary text-primary-content">

            <div class="stat">
                <div class="stat-title">{{lang[selectedLang].totaltickets}}</div>
                <div class="stat-value">{{ getAllTicketsCount() }}</div>
            </div>

            <div class="stat">
                <div class="stat-title">{{lang[selectedLang].yourtickets}}</div>
                <div class="stat-value">{{ getTicketsNumber() }}</div>
            </div>
            <div class="stat">
                <div class="stat-title">{{lang[selectedLang].participatedtickets}}</div>
                <div class="stat-value">{{ getUserTicketsNumber() }}</div>
            </div>

        </div>
    </div>
</template>