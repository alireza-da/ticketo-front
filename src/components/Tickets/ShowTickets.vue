<script>


import { ref } from "vue";
import Ticket from "@/components/Tickets/TicketCard.vue";
import axios from 'axios';

const show_make_ticket = ref(false)


export default {
    name: "ShowTicket",
    components: { Ticket },
    props: {
        passedTicketList: {
            type: Array,
            default: []
        },
        userData: Object,
        lang: Object,
        selectedLang: String,
        verifiedCat: Array,
        systems: Array
    },
    watch: {
        async passedTicketList(newVal) {
            this.doneFetchingTickets = false
            this.ticketList = []
            for (const t of newVal) {
                if (!t.is_deleted && await this.isVerifiedCat(t) && t.is_closed === this.is_closed) {
                    this.ticketList.push(t)
                    await this.fetchSys(t)
                    await this.fetchClientRolesOfSystem(t.sys_id)
                }

            }
            this.doneFetchingTickets = true
        },
        async systems(newVal) {
            if (this.systemList !== newVal) {

                this.systemList = newVal
                this.categories = []
                await this.fetchCategories()
            }



        }
    },
    async created() {
        this.token = localStorage.getItem('token')
        this.doneFetchingTickets = false
        this.ticketList = []
        this.categories = []
        this.systemList = this.$props.systems
        for (const t of this.$props.passedTicketList) {
            if (!t.is_deleted && await this.isVerifiedCat(t) && t.is_closed === this.is_closed) {
                this.ticketList.push(t)
                await this.fetchSys(t)
                if (!this.clientRoles[t.sys_id])
                    await this.fetchClientRolesOfSystem(t.sys_id)
            }
        }
        this.doneFetchingTickets = true
        this.fetchCategories()

    },
    methods: {
        async fetchClientRolesOfSystem(sid) {
            await axios.get(`${this.userRolesAPI}${sid}/${this.userData.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.clientRoles[sid] = res.data
            })
        },
        sortTickets(i) {
            this.asc = !this.asc
            const comparer = (v1, v2) => {
                switch (i) {
                    case 'category':
                        return this.asc ? v1.category.localeCompare(v2.category[0].name) : v2.category[0].name.localeCompare(v1.category[0].name)

                    case 'name':
                        return this.asc ? v1.name.localeCompare(v2.name) : v2.name.localeCompare(v1.name)

                    case 'status':
                        return this.asc ? v1.status.localeCompare(v2.status) : v2.status.localeCompare(v1.status)

                    case 'date':
                        return this.asc ? v1.created_at.localeCompare(v2.created_at) : v2.created_at.localeCompare(v1.created_at)

                }
            }

            this.ticketList.sort(comparer)
        },
        async fetchCategories() {
            if (this.semaphore === 0) {
                this.semaphore ++
                this.categories = []
                for (const sys of this.systemList) {
                    await axios.get(`${this.categoryDetailsAPI}${sys.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                        sys.categories = res.data
                        for (const cat of sys.categories) {

                            this.categories.push(cat)

                        }
                    })
                }
                this.semaphore = 0
            }
        },

        async filterByCategory(cat) {
            this.doneFetchingTickets = false
            this.selectedCat = cat
            this.ticketList = []
            if (this.selectedCat === 'all') {
                for (const t of this.$props.passedTicketList) {
                    if (!t.is_deleted && await this.isVerifiedCat(t) && t.is_closed === this.is_closed) {
                        this.ticketList.push(t)
                        await this.fetchSys(t)
                    }
                }
                this.doneFetchingTickets = true
                return
            }
            for (const t of this.$props.passedTicketList) {

                if (t.category[0]) {

                    if (!t.is_deleted && await this.isVerifiedCat(t) && t.is_closed === this.is_closed && t.category[0].id === this.selectedCat.id) {
                        this.ticketList.push(t)
                        await this.fetchSys(t)
                    }
                    continue
                }
                if (!t.is_deleted && await this.isVerifiedCat(t) && t.is_closed === this.is_closed && t.category === this.selectedCat.id) {
                    this.ticketList.push(t)
                    await this.fetchSys(t)
                }

            }
            this.doneFetchingTickets = true
        },
        findCatSystem(cat) {
            for (const sys of this.systemList) {
                if (sys.id === cat.sys_id) {
                    return sys
                }
            }
        },
        findOpenTickets(cat) {
            let result = []
            if (cat === 'all') {
                for (const t of this.$props.passedTicketList) {
                    if (t.is_closed === false) {
                        result.push(t)
                    }
                }
                return result
            }
            for (const t of this.$props.passedTicketList) {

                if (t.category[0]) {

                    if (t.is_closed === false && t.category[0].id === cat.id) {
                        result.push(t)
                    }
                    continue
                }
                if (t.is_closed === false && t.category === cat.id) {
                    result.push(t)
                }

            }
            return result
        },
        async toggleCloseList() {
            this.doneFetchingTickets = false
            this.is_closed = !this.is_closed
            this.ticketList = []
            for (const t of this.$props.passedTicketList) {
                if (!t.is_deleted && await this.isVerifiedCat(t) && t.is_closed === this.is_closed) {
                    this.ticketList.push(t)
                    await this.fetchSys(t)
                }
            }
            this.doneFetchingTickets = true
        },
        async isVerifiedCat(t) {
            // check if owner of system
            if (this.clientRoles[t.sys_id]) {
                for (const r of this.clientRoles[t.sys_id]) {
                    if (r.owner) {
                        return true
                    }
                }
            }
            var result = false
            if (t.ticketOwner && t.ticketOwner.id === this.userData.id) {
                return true
            }
            else if (!t.ticketOwner) {
                await axios.get(`${this.findTicketOwnerAPI}${t.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(response => {
                    if (response.data.id === this.userData.id)
                        result = true
                }).catch(error => {
                })
            }
            if (result) {
                return result
            }
            // fetching valid categories of each system for a user

            await axios.get(`${this.verifiedCategoriesAPI}${this.$props.userData.id}/${t.sys_id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                for (const cr of res.data) {
                    if (cr.category === t.category && cr.for_closed === this.is_closed) {
                        result = true
                    }
                    if (t.category[0] && cr.category === t.category[0].id && cr.for_closed === this.is_closed) {
                        result = true
                    }
                }
            })

            return result
        },
        create_ticket() {
            this.$emit("toggle_make_show")
        },
        select_ticket(ticket) {
            this.$emit("select_ticket", ticket)
        },
        async fetchSys(ticket) {
            await axios.get(`${this.systemDetailsAPI}${ticket.sys_id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                ticket.system = res.data
                ticket.ticketOwner = await this.findTicketOwner(ticket.id)
                await this.findTicketCategory(ticket)
                if (ticket.is_closed) {
                    ticket.status = "Closed"
                }
                else ticket.status = "Open"
            })
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
            if (ticket.category[0]) {
                await axios.get(`${this.categryListAPI}${ticket.category[0].id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async resonse => {
                    ticket.category = [resonse.data]
                })
                return
            }
            await axios.get(`${this.categryListAPI}${ticket.category}`, { headers: { Authorization: `Token ${this.token}` } }).then(async resonse => {
                ticket.category = [resonse.data]
            })
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


    },
    data() {
        return {
            clientRoles: {},
            semaphore: 0,
            ticketList: [],
            systemList: [],
            token: null,
            asc: true,
            selectedCat: null,
            categories: [],
            closedTicketList: [],
            is_closed: false,
            doneFetchingTickets: false,
            // APIs
            systemDetailsAPI: 'http://127.0.0.1:8000/api/systems/details/', // sys id
            findTicketOwnerAPI: 'http://127.0.0.1:8000/api/tickets/roles/ticketowner/', // tid
            categryListAPI: 'http://127.0.0.1:8000/api/categories/details/', // cid
            verifiedCategoriesAPI: 'http://127.0.0.1:8000/api/category/role/user/', // uid/sysid
            categoryDetailsAPI: 'http://127.0.0.1:8000/api/system/categories/details/', // <int:sysid>
            userRolesAPI: 'http://127.0.0.1:8000/api/roles/details/', // <int:sysid>/<int:uid>,
        }
    }

}
</script>


<template>
    <div class="flex-col">
        <div class="justify-items-center focus:outline-none focus:ring focus:ring-neutral" style="text-align: center">
            <div class="btn-group">
                <label for="search" class="input-group mr-2"><span><i class='bx bx-search-alt'></i></span><input id="search"
                        class="input input-bordered w-full max-w-xs" :placeholder="lang[selectedLang].searchticket"
                        type="text" @keyup="searchTable('ticketsTable', 'search')" /></label>
                <div class="dropdown dropdown-hover">
                    <label class="btn btn-outline btn-neutral bg-primary text-white hover:(bg-accent text-black)">{{
                        lang[selectedLang].category }}</label>
                    <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-62">
                        <li><a @click="filterByCategory('all')">All - {{ findOpenTickets('all').length }}</a></li>
                        <li v-for="cat in categories" v-bind:key="cat.id"><a @click="filterByCategory(cat)">
                                {{ findCatSystem(cat).name }} | {{ cat.name }} - {{ findOpenTickets(cat).length }}</a>
                        </li>
                    </ul>
                </div>
                <button class="btn btn-outline btn-neutral bg-primary text-white hover:(bg-accent text-black)"
                    @click="toggleCloseList()"><i class='bx bxs-hide mr-2' v-if="!is_closed"></i><i
                        class='bx bxs-bullseye mr-2' v-if="is_closed"></i>
                    <p v-if="is_closed">{{ lang[selectedLang].open }}</p>
                    <p v-if="!is_closed">{{ lang[selectedLang].closed }}</p>
                </button>

                <button class="btn btn-outline btn-neutral bg-primary text-white hover:(bg-accent text-black) mr-2"
                    @click="create_ticket()"><i class='bx bx-plus-medical mr-2' style='color:'></i>
                    {{ lang[selectedLang].create }}
                </button>

            </div>


        </div>


        <div class="overflow-x-auto  overflow-y-auto">
            <progress class="progress w-full progress-accent" v-show="!doneFetchingTickets"></progress>
            <table class="table w-full " id="ticketsTable" v-show="doneFetchingTickets">
                <!-- head -->
                <thead>
                    <tr>
                        <th>#</th>
                        <th>
                            <button class="btn btn-link link-accent" @click="sortTickets('category')"> {{
                                lang[selectedLang].category
                            }}</button>
                        </th>
                        <th>
                            <button class="btn btn-link link-accent" @click="sortTickets('name')"> {{
                                lang[selectedLang].name }}</button>
                        </th>
                        <th>
                            <button class="btn btn-link link-accent" @click="sortTickets('date')"> {{
                                lang[selectedLang].date }}</button>
                        </th>
                        <th>
                            <button class="btn btn-link link-accent" @click="sortTickets('system')"> {{
                                lang[selectedLang].systems }}</button>
                        </th>
                        <th>
                            <button class="btn btn-link link-accent" @click="sortTickets('status')"> {{
                                lang[selectedLang].status }}</button>
                        </th>
                    </tr>
                </thead>
                <tbody>

                    <Ticket v-for="ticket in ticketList" :tickets="ticket" :key="ticket.id"
                        :index="ticketList.indexOf(ticket)" @select_ticket="select_ticket(ticket)">
                    </Ticket>
                </tbody>
            </table>
        </div>
    </div>
</template>


<style scoped>
#search {
    background: url(search.png) no-repeat scroll 8px 8px;
    padding-left: 40px;

}
</style>