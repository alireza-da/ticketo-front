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
        await this.fetchAdminStats()
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
            adminStats: [],
            index: 0,
            // APIs
            systemsListAPI: 'https://ticketoapi.liara.run/api/systems/list/',
            ticketsAPI: "https://ticketoapi.liara.run/api/users/details/tickets/", // e.g https://ticketoapi.liara.run/api/users/details/tickets/1
            ticketListAPI: 'https://ticketoapi.liara.run/api/tickets/list/',
            userSystemsAPI: "https://ticketoapi.liara.run/api/systems/details/user/", // e.g https://ticketoapi.liara.run/api/systems/details/user/1
            userAPI: "https://ticketoapi.liara.run/api/users/details/ata/", // e.g https://ticketoapi.liara.run/api/users/details/1
            serverMediaAPI: 'https://ticketoapi.liara.run', //path
            adminStatsAPI: 'https://ticketoapi.liara.run/api/systems/admin-stats'
        }
    },
    methods: {
        async fetchSystems() {
            await axios.get(`${this.systemsListAPI}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
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
        async fetchAdminStats() {

            await axios.get(`${this.adminStatsAPI}`, { headers: { 'Authorization': `Token ${this.token}` } }).then(response => {

                this.adminStats = response.data
            })
        },
        getUserSystemsNumber() {
            return this.systemsData ? this.systemsData.length : 0
        },
        getTicketsNumber() {
            return this.ticketsData ? this.ticketsData.length : 0
        },
        getUserData(key) {
            if (key === 'pfp') {
                return this.userData ? `${this.serverMediaAPI}${this.userData[key]}` : "../assets/3f9470b34a8e3f526dbdb022f9f19cf7.jpg"
            }
            return this.userData ? this.userData[key] : ""
        },
        getUserTicketsNumber() {
            return this.userTickets ? this.userTickets.length : 0
        },
        async fetchUserTickets() {
            await axios.get(`${this.ticketsAPI}${this.userData.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.userTickets = res.data
            })
            await axios.get(`${this.ticketListAPI}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.allTickets = res.data
            })
        },
        getAllTicketsCount() {
            return this.allTickets ? this.allTickets.length : 0
        },
        sortTickets(i) {
            this.asc = !this.asc
            const comparer = (v1, v2) => {
                switch (i) {
                    case 'name':
                        return this.asc ? v1.user_name.localeCompare(v2.user_name) : v2.user_name.localeCompare(v1.user_name)

                    case 'discord_id':
                        return this.asc ? v1.user_discord.localeCompare(v2.user_discord) : v2.user_discord.localeCompare(v1.user_discord)

                    case 'ticket':
                        return this.asc ? v1.p_tickets.localeCompare(v2.p_tickets) : v2.p_tickets.localeCompare(v1.p_tickets)

                    case 'chat':
                        return this.asc ? v1.message_count.localeCompare(v2.message_count) : v2.message_count.localeCompare(v1.message_count)

                }
            }

            this.adminStats.sort(comparer)
        },
        searchTable(tableId, inputId) {
            // Declare variables
            var input, filter, table, tr, td, i, txtValue;
            input = document.getElementById(inputId);
            filter = input.value.toUpperCase();
            table = document.getElementById(tableId);
            tr = table.getElementsByTagName("tr");

            // Loop through all table rows, and hide those who don't match the search query
            for (i = 0; i < tr.length; i++) {
                td = tr[i].getElementsByTagName("td")[0];

                if (td) {
                    txtValue = td.textContent || td.innerText;
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        tr[i].style.display = "";
                    } else {
                        tr[i].style.display = "none";
                    }
                }
            }
        },
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
                <div class="stat-title">{{ lang[selectedLang].totalsystems }}</div>
                <div class="stat-value text-primary">{{ systems.length }}</div>
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
                <div class="stat-title">{{ lang[selectedLang].yoursystems }}</div>
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
                <div class="stat-title">{{ lang[selectedLang].totaltickets }}</div>
                <div class="stat-value">{{ getAllTicketsCount() }}</div>
            </div>

            <div class="stat">
                <div class="stat-title">{{ lang[selectedLang].yourtickets }}</div>
                <div class="stat-value">{{ getTicketsNumber() }}</div>
            </div>
            <div class="stat">
                <div class="stat-title">{{ lang[selectedLang].participatedtickets }}</div>
                <div class="stat-value">{{ getUserTicketsNumber() }}</div>
            </div>

        </div>
        <!--Admin Stats-->
        <label for="search" class="input-group mr-2 mt-5"><span><i class='bx bx-search-alt'></i></span><input id="asearch"
                class="input input-bordered w-full max-w-xs" :placeholder="lang[selectedLang].search" type="text"
                @keyup="searchTable('adminsTable', 'asearch')" /></label>
        <table class="table w-full " id="adminsTable">
            <!-- head -->
            <thead>
                <tr>
                    <th>#</th>
                    <th>
                        <button class="btn btn-link link-accent" @click="sortTickets('name')"> {{
                            lang[selectedLang].name
                        }}</button>
                    </th>
                    <th>
                        <button class="btn btn-link link-accent" @click="sortTickets('discord')">
                            Discord ID</button>
                    </th>
                    <th>
                        <button class="btn btn-link link-accent" @click="sortTickets('ticket')"> {{
                            lang[selectedLang].respondedtickets }}</button>
                    </th>
                    <th>
                        <button class="btn btn-link link-accent" @click="sortTickets('chat')"> {{
                            lang[selectedLang].messagesent }}</button>
                    </th>
                </tr>
            </thead>
            <tbody>

                <tr class="hover" @click="select_ticket()" id="tableRow" v-for="ast in adminStats" v-bind:key="ast">

                    <th>{{ ast.user_id }}</th>

                    <td>{{ ast.user_name }}</td>
                    <td>{{ ast.user_discord }}</td>
                    <td>{{ ast.p_tickets }}</td>
                    <td>{{ ast.message_count }}</td>

                </tr>
            </tbody>
        </table>
    </div>
</template>