<script>



import MakeTicket from "@/components/Tickets/MakeTicket.vue";

import ShowTicket from "@/components/Tickets/ShowTickets.vue";
import TicketPage from "@/components/Tickets/TicketPage.vue";
import axios from 'axios'

export default {
    components: {ShowTicket, MakeTicket,TicketPage},

    props: {
        title: {
            type: String,
            default: 'Tab',
            lang: Object,
            selectedLang: String
        },
        navigatedTicket: {
            type: Object,
            default: null
        },
        systems: {
            type: Array,
            default: []
        },
        lang: Object,
        selectedLang: String
    },
    watch: { 
        navigatedTicket(ticket){
            this.selectedTicket = ticket
            this.select_ticket(ticket)
        },
        systems(syss){
            this.passedSys = syss
        }
    },
    async created(){
        this.token = localStorage.getItem('token')
        await this.fetchUserData()
        await this.fetchTickets()
    
        if(!this.$props.systems){
            await this.fetchSystems()
            
            await this.fetchSys()
            return
        }
        this.passedSys = this.$props.systems
        await this.fetchSys()
        
    },
    methods: {
        toggle_make_show() {
            this.show_tickets = !this.show_tickets
            this.show_make_ticket = !this.show_make_ticket
            

        },
        select_ticket(ticket){
            this.show_tickets = false
            this.show_make_ticket = false
            this.show_ticket_page = true
            this.selectedTicket = ticket
        },
        async close_ticket_page(){
            this.show_tickets = true
            this.show_ticket_page = false
            await this.fetchTickets()
            // this.$forceUpdate()
            this.selectedTicket = null
        },
        async fetchTickets(){
            this.tickets = []
            await axios.get(`${this.userTicketListAPI}${this.userData.id}`, {headers: {Authorization: `Token ${this.token}`}}).then(res => {
                this.tickets = res.data
            })
        },
        async fetchUserData(){
            await axios.get(`${this.userDataAPI}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.userData = res.data
            })
        },
        async fetchSystems(){
            await axios.get(`${this.systemsAPI}${this.userData.id}`, {headers: {'Authorization': `Token ${this.token}`}}).then((response) => {
                this.passedSys = response.data
                
            })
        },
        async fetchSys(){
            for(var sys of this.passedSys){
                await axios.get(`${this.categoryDetailsAPI}${sys.id}`, {headers: {Authorization: `Token ${this.token}`}}).then(async res => {
                    sys.categories = res.data
                                 
                })
            }
        },
        navigateToTicketPage(ticket){
            this.selectedTicket = ticket
            this.select_ticket(ticket)
        }
    },
    data() {


        return {
            isActive: false,
            isSystemSelected: false,
            show_tickets: true,
            show_make_ticket: false,
            selectedTicket:null,
            show_ticket_page:false,
            tickets: [],
            passedSys: [],
            verifiedCat: [],
            userData: null,
            token: null,
            // APIs
            userTicketListAPI: 'http://localhost:8000/api/users/details/tickets/', //'<int:uid>'
            userDataAPI: 'http://localhost:8000/api/users/details/ata/',
            categoryDetailsAPI: 'http://localhost:8000/api/system/categories/details/', // <int:sysid>
            systemsAPI: "http://localhost:8000/api/systems/details/user/",
            verifiedCategoriesAPI: 'http://localhost:8000/api/category/role/user/' // uid/sysid
        }
    }
}
</script>

<template>
    <div v-show="isActive" style="height: 90%" class="m-5">
        <ShowTicket v-if="show_tickets" @toggle_make_show="toggle_make_show" @select_ticket="select_ticket" :systems="passedSys" :passedTicketList="tickets" :userData="userData" :lang="lang" :selectedLang="selectedLang" :verifiedCat="verifiedCat"></ShowTicket>
        <MakeTicket v-if="show_make_ticket" @toggle_make_show="toggle_make_show" :systems="passedSys" :userData="userData" v-on:navigate-to-ticket="navigateToTicketPage" :lang="lang" :selectedLang="selectedLang"></MakeTicket>
        <TicketPage v-if="show_ticket_page" :ticket="selectedTicket" @close_ticket_page="close_ticket_page" :systems="passedSys" :lang="lang" :selectedLang="selectedLang"></TicketPage>

    </div>


</template>