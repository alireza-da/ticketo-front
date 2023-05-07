<template>
    <tr class="hover" @click="select_ticket()" id="tableRow">

        <th>{{ index + 1 }}</th>

        <td v-if="tickets.category.length > 0">{{ tickets.category[0].name }}</td>
        <td v-if="tickets.category.length == 0">-</td>
        <td>{{ tickets.name }}</td>
        <td>{{ formatDate(tickets.created_at) }}</td>
        <td v-if="tickets.system">{{ tickets.system.name }}</td>
        <td v-if="!tickets.system">-</td>
        <td v-if="tickets.status">{{ tickets.status }}</td>
        <td v-if="!tickets.status">-</td>
    </tr>
</template>

<script>
import ticketPage from "@/components/Tickets/TicketPage.vue";
import { ref } from "vue";

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Ticket",
    props: {
        tickets: {
            type: Object,
            default: null
        },
        index: {
            type: Number,
            default: 1
        }
    },
    methods: {
        display() {
            console.log('clicked')
        },
        select_ticket() {
            this.$emit('select_ticket')
        },
        formatDate(date){
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var date = new Date(date)
            return date.toLocaleString("en-US", options)
        }
    },
    created() {
        // console.log(this.$props.tickets);
        
    },
    data() {
        return {
            
        }
    }
}
</script>

<style scoped></style>