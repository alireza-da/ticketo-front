<script setup>
import Navbar from '../components/Navbar.vue'
import Systems from '../components/System/Systems.vue'
import Tickets from '../components/Tickets/Tickets.vue'
import Statistics from '../components/Statistics.vue'
import Profile from '../components/Profile/Profile.vue'

</script>

<script >
import axios from 'axios'

export default {
    props: {
        lang: Object,
        selectedLang: String
    },
    data() {
        return {
            selectedIndex: 1,
            restrictedMode: false,
            _tabs: ["systems", "tickets", "statistics", "profile"],
            path: [],
            navigatedTicket: null,
            token: null,
            // API URIs 
            ticketsAPI: "https://ticketoapi.liara.run/api/users/details/tickets/", // e.g https://ticketoapi.liara.run/api/users/details/tickets/1
            systemsAPI: "https://ticketoapi.liara.run/api/systems/details/user/", // e.g https://ticketoapi.liara.run/api/systems/details/user/1
            userAPI: "https://ticketoapi.liara.run/api/users/details/ata/", // e.g https://ticketoapi.liara.run/api/users/details/1
            systemDetailsAPI: 'https://ticketoapi.liara.run/api/systems/details/', // sys id
            findTicketOwnerAPI: 'https://ticketoapi.liara.run/api/tickets/roles/ticketowner/', // tid
            categryListAPI: 'https://ticketoapi.liara.run/api/categories/details/', // cid
            userData: null,
            systemsData: null,
            ticketsData: null,
            // passedLang: {},
            // passedSelectedLang: {}

        }
    },
    created() {
        this.token = localStorage.getItem('token')

        if (!this.token) {
            this.$router.push('/login')
        }


    },
    async mounted() {
        this.selectTab(this.selectedIndex)
        await this.fetchUserData()
        await this.fetchSystems()
        await this.fetchTickets()
        if (this.$route.params.ticketname && this.$route.params.ticketid) {
            this.restrictedMode = true
            await this.findTicketByIdName(this.$route.params.ticketid, this.$route.params.ticketname)
        }

    },
    methods: {
        exitRestrictedMode(i) {
            if (this.restrictedMode) {
                this.restrictedMode = false
                location.href = `https://ticket.sunrp.ir/dashboard`                
            }
        },
        async selectTab(i) {
            this.selectedIndex = i
            // loop over all the tabs
            this._tabs.forEach((tab, index) => {
                this.$refs[tab].isActive = (index === i)
                if (this.$refs[tab].isActive) {
                    this.path = []
                    this.path.push(tab)
                }
            })

        },
        updatePath(val) {
            this.path = val
        },
        backToMainOption(elem) {
            this.$refs[elem.toLowerCase()].isSystemSelected = false
            this.path = [elem]
        },
        async findTicketOwner(tid) {
            var result
            await axios.get(`${this.findTicketOwnerAPI}${tid}`, { headers: { Authorization: `Token ${this.token}` } }).then(response => {
                result = response.data
            }).catch(error => {
                result = { email: "System" }
            })
            return result
        },
        async findTicketCategory(ticket) {
            await axios.get(`${this.categryListAPI}${ticket.category}`, { headers: { Authorization: `Token ${this.token}` } }).then(async resonse => {
                ticket.category = [resonse.data]
            })
        },
        async navigateToTicketPage(ticket) {
            await axios.get(`${this.systemDetailsAPI}${ticket.sys_id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                ticket.system = res.data
                ticket.ticketOwner = await this.findTicketOwner(ticket.id)
                await this.findTicketCategory(ticket)
                if (ticket.is_closed) {
                    ticket.status = "Closed"
                }
                else ticket.status = "Open"
                this.selectedIndex = 1
                this.navigatedTicket = ticket
                this.selectTab(this.selectedIndex)
            })

        },
        async fetchUserData() {
            await axios.get(`${this.userAPI}`, { headers: { 'Authorization': `Token ${this.token}` } }).then((response) => {
                this.userData = response.data
            })
        },
        async fetchSystems() {
            await axios.get(`${this.systemsAPI}${this.userData['id']}`, { headers: { 'Authorization': `Token ${this.token}` } }).then((response) => {
                this.systemsData = response.data

            })
        },
        async fetchTickets() {
            await axios.get(`${this.ticketsAPI}${this.userData['id']}`, { headers: { 'Authorization': `Token ${this.token}` } }).then((response) => {
                this.ticketsData = response.data
            })
        },
        async findTicketByIdName(tid, tname) {
            for (const t of this.ticketsData) {
                if (t.name === tname && t.id === parseInt(tid)) {
                    await this.navigateToTicketPage(t)

                }
            }

        },
        changeLang(lang) {
            this.$emit('change-lang', lang)
        },
        changeTheme(theme) {
            this.$emit('change-theme', theme)
        }
    },
    watch: {
        path: {
            handler(val) {

            }
        },

    },
    components: {
        Systems,
        Tickets,
        Statistics,
        Profile
    }

}
</script>


<template flex>
    <div class="h-full w-full">
        <Navbar v-on:select-tab="selectTab" v-on:change-lang="changeLang" v-on:change-theme="changeTheme" :lang="lang" :selectedLang="selectedLang">
        </Navbar>
        <div class="dashboard flex flex-col p-3 space-x-1" style="width: 100%; height: 93%; font-family: BalooBhaijaan">
            <div style="display: inline-block;" class="sidebar h-20 w-full mb-2">
                <ul class="menu menu-horizontal lg:menu-horizontal bg-base-100 w-full h-20 p-2 rounded-box">
                    <li v-bind:class="{ 'bg-primary': selectedIndex == 0 }" class="">
                        <a @click="exitRestrictedMode(0); selectTab(0)">
                            <i class="bx bx-support"></i>
                            {{lang[selectedLang].systems}}
                        </a>
                    </li>
                    <li v-bind:class=" { 'bg-primary': selectedIndex == 1 } ">
                        <a @click=" exitRestrictedMode(1); selectTab(1) ">
                            <i class="bx bx-envelope"></i>
                            {{lang[selectedLang].tickets}}
                        </a>
                    </li>
                    <li v-bind:class=" { 'bg-primary': selectedIndex == 2 } " v-if="userData && userData.is_staff">
                        <a @click=" exitRestrictedMode(2); selectTab(2) ">
                            <i class="bx bx-stats"></i>
                            {{lang[selectedLang].statistics}}
                        </a>
                    </li>
                    <li v-bind:class=" { 'bg-primary': selectedIndex == 3 } ">
                        <a @click=" exitRestrictedMode(3); selectTab(3) ">
                            <i class='bx bxs-user-circle'></i>
                            {{lang[selectedLang].profile}}
                        </a>
                    </li>
                </ul>
            </div>
            <div style="display: " class="h-full w-full rounded-xl bg-base-200 overflow-auto -ml-16">
                <div class="text-sm breadcrumbs m-2 mb-0">
                    <ul>
                        <li v-for="p in path" v-bind:key=" p ">
                            <a @click=" backToMainOption(p) ">
                                <i class="bx bx-support m-2" v-if=" selectedIndex == 0 "></i>
                                <i class="bx bx-envelope m-2" v-if=" selectedIndex == 1 "></i>
                                <i class="bx bx-stats m-2" v-if=" selectedIndex == 2 "></i>
                                <i class="bx bx-cog m-2" v-if=" selectedIndex == 3 "></i>
                                {{ p }}
                            </a>
                        </li>
                    </ul>
                </div>
                <Systems ref="systems" v-on:update-path=" updatePath " v-on:navigate-to-ticket-page=" navigateToTicketPage "
                    :systems=" systemsData " :userData=" userData " v-on:fetch-system=" fetchSystems " :lang=" lang "
                    :selectedLang=" selectedLang "></Systems>
                <Tickets ref="tickets" :navigatedTicket=" navigatedTicket " :tickets=" ticketsData "
                    :systems=" systemsData " :lang=" lang " :selectedLang=" selectedLang ">
                </Tickets>
                <Statistics ref="statistics" :lang=" lang " :selectedLang=" selectedLang ">
                </Statistics>
                <Profile ref="profile" :lang=" lang " :selectedLang=" selectedLang "></Profile>
            </div>
        </div>
    </div>
</template>