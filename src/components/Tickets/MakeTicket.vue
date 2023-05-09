<script>
import axios from 'axios';
export default {
    name: "MakeTicket",
    props: {
        systems: {
            type: Array,
            default: []
        },
        userData: {
            type: Object,
            default: null
        },
        lang: Object,
        selectedLang: String
    },
    watch: {
        systems(syss) {
            this.passedSys = syss
        }
    },
    created() {
        this.token = localStorage.getItem('token')
        this.passedSys = this.$props.systems
        this.passedUserData = this.$props.userData
        this.selectedSys = this.$props.systems[0]

    },
    data() {
        return {
            passedSys: [],
            passedUserData: null,
            selectedSys: null,
            sysObj: {},
            ticketMessage: "",
            selectedCat: null,
            msgAttachment: null,
            token: null,
            systemUsers: [],
            createdTicket: {},
            customFields: {},
            customFieldsKey: [],
            // APIs
            ticketListAPI: 'https://ticket-backend.iran.liara.run/api/tickets/list/',
            ticketRoleListAPI: 'https://ticket-backend.iran.liara.run/api/tickets/roles/list/',
            messageListAPI: 'https://ticket-backend.iran.liara.run/api/tickets/messages/list/',
            attachmentListAPI: 'https://ticket-backend.iran.liara.run/api/tickets/messages/details/attachment/list/',
            systemUsersWithRolesAPI: 'https://ticket-backend.iran.liara.run/api/systems/details/users/withroles/', // sys_id
            postDefaultMessageAPI: 'https://ticket-backend.iran.liara.run/api/tickets/send/defaultmessage/',
        }
    },
    methods: {
        async fetchSystemUsers() {
            await axios.get(`${this.systemUsersWithRolesAPI}${this.selectedSys.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.systemUsers = res.data
            })
        },
        fetchCategoryCustomFields() {
            this.customFieldsKey = []
            this.customFields = JSON.parse(this.selectedCat.custom_fields)
            for (const field in this.customFields) {
                this.customFieldsKey.push(field)
            }
        },
        show_tickets() {
            this.$emit("toggle_make_show")
        },
        async updateSelectedSys(event) {
            // var selected = event.target.options[event.target.selectedIndex].value
            this.selectedSys = this.passedSys[event.target.selectedIndex - 1]
            await this.fetchSystemUsers()
            this.$forceUpdate()
        },
        updatedSelectedCat(event) {
            // var selected = event.target.options[event.target.selectedIndex].value
            this.selectedCat = this.selectedSys.categories[event.target.selectedIndex - 1]
            this.fetchCategoryCustomFields()
            this.$forceUpdate()
        },
        getCurrentCats() {
            return this.selectedSys.categories
        },
        setMessageAttachment(event) {
            this.msgAttachment = event.target.files[0]
        },
        findFileType(file) {
            var ext = file.name.split('.').pop();
            ext = ext.toLowerCase()
            if (ext === 'jpg' || ext === 'png') {
                return 'picture'
            }
            if (ext === 'mp4' || ext === 'mkv' || ext === 'webm' || ext === 'mov' || ext === 'wmv' || ext === 'flv' || ext === 'avi' || ext === 'gif') {
                return 'video'
            }
            if (ext === 'mp3' || ext === 'wma' || ext === 'm4a') {
                return 'audio'
            }
            return 'other'
        },
        async createTicket() {
            var successLevel = 0
            // create 
            await axios.post(`${this.ticketListAPI}`, {
                name: `${this.selectedSys.ticket_prefix}-${this.selectedCat.name}-${this.passedUserData.id}-${this.passedUserData.name}`, sys_id: this.selectedSys.id, category: this.selectedCat.id
            }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.createdTicket = res.data
                successLevel += 1
            }).catch(err => {
                this.$notify({
                    group: 'error',
                    title: 'error',
                    text: 'Something Wrong'
                })
            })

            // create ticket role
            // for creator
            this.fetchSystemUsers()
            await axios.post(`${this.ticketRoleListAPI}`, {
                "user_id": this.passedUserData.id,
                "sys_id": this.selectedSys.id,
                "name": "Default",
                "t_id": this.createdTicket.id,
                "is_creator": true,
                "read_messages": true,
                "write_messages": true,
                "delete_messages": false,
                "read_history": true,
                "upload_media": true
            }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                successLevel += 1
            })
            // for system ticket managers
            for (const u of this.systemUsers) {
                for (const r of u.roles) {
                    if (r.manage_system || r.owner || r.update_ticket || r.level >= 10) {
                        await axios.post(`${this.ticketRoleListAPI}`, {
                            "user_id": r.user_id,
                            "sys_id": this.selectedSys.id,
                            "name": "Ticket Responder",
                            "t_id": this.createdTicket.id,
                            "is_creator": false,
                            "read_messages": true,
                            "write_messages": true,
                            "delete_messages": r.delete_messages,
                            "read_history": true,
                            "upload_media": true,
                            "delete_ticket": r.delete_ticket,
                            "create_ticket": true,
                            "update_ticket": true,
                            
                        }, { headers: { Authorization: `Token ${this.token}` } })
                    }
                }
            }
            // post default category message
            await axios.post(`${this.postDefaultMessageAPI}`, {
                cat_id: this.selectedCat.id,
                ticket_id: this.createdTicket.id
            }, {headers: {Authorization: `Token ${this.token}`}}).catch(err => {
                this.$notify({
                            group: "Error",
                            title: 'Error',
                            text: 'Category has no default message'
                        }, 1000)
            })
            // post custom fields 
            var customFieldsResult = []
            for (const cf of this.customFieldsKey) {
                let el = document.getElementById(cf)
                console.log(el.value);
                customFieldsResult.push(el.value)
            }
            var msg = '';
            for (const cf of this.customFieldsKey) {
                msg += `${cf}: ${customFieldsResult[this.customFieldsKey.indexOf(cf)]} | `
            }
            if (msg !== '') {
                await axios.post(`${this.messageListAPI}`, {
                    "content": msg,
                    "user_id": this.passedUserData.id,
                    "ticket_id": this.createdTicket.id
                }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                    successLevel += 1
                })
            }
            // post message
            
            await axios.post(`${this.messageListAPI}`, {
                "content": this.ticketMessage,
                "user_id": this.passedUserData.id,
                "ticket_id": this.createdTicket.id
            }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                successLevel += 1
                this.ticketMessage = res.data
                this.createdTicket.ticketOwner = this.passedUserData
                this.createdTicket.category = [this.selectedCat]
                // this.show_tickets()
                this.$emit('navigate-to-ticket', this.createdTicket)
            })
            // post attachment
            if (this.msgAttachment) {
                await axios.post(`${this.attachmentListAPI}`, {
                    "message_id": this.ticketMessage.id,
                    "media": this.msgAttachment,
                    "type": this.findFileType(this.msgAttachment)
                }, { headers: { Authorization: `Token ${this.token}`, "Content-Type": 'multipart/form-data' } }).then(res => {
                    if (successLevel > 2) {
                        this.$notify({
                            group: "foo",
                            title: 'Success',
                            text: 'Ticket created'
                        }, 2500)

                    }

                })
            }
        }
    },
}
</script>
<template>
    <div class="grid gap-6 " style=" padding: 20px">

        <label class="input-group w-full ">
            <span class="w-1/10"> {{ lang[selectedLang].system }}</span>
            <select class="select  w-9/10 focus:outline-none focus:ring focus:ring-neutral" v-on:change="updateSelectedSys">
                <option disabled selected> {{ lang[selectedLang].selectsystem }}</option>
                <option v-for="sys in systems" v-bind:key="sys.id">{{ sys.name }}</option>


            </select>
        </label>
        <label class="input-group w-full ">
            <span class="w-1/10"> {{ lang[selectedLang].category }}</span>
            <select class="select  w-9/10 focus:outline-none focus:ring focus:ring-neutral"
                v-on:change="updatedSelectedCat">
                <option disabled selected> {{ lang[selectedLang].selectticketcategory }}</option>
                <option v-for="cat in getCurrentCats()" v-bind:key="cat.id">{{ cat.name }}</option>


            </select>
        </label>
        <label class="input-group w-full ">
            <span class="w-1/10 h-12"> {{ lang[selectedLang].customfields }}</span>
            <div v-for="field of customFieldsKey" v-bind:key="field" class="ml-3">
                <span class="w-full h-12 mb-2">{{ field }}</span>
                <input type="text" :placeholder="`Enter your ${field}`" :id="field" class="input" required>
            </div>

        </label>

        <label class="input-group w-full">
            <span class="w-1/10 place-items-start" style="padding-top: 5px"> {{ lang[selectedLang].message }}</span>
            <textarea class="textarea w-9/10 focus:outline-none focus:ring focus:ring-neutral" v-model="ticketMessage"
                :placeholder="lang[selectedLang].addyourmessage"></textarea>
        </label>
        <!-- <label class="input-group w-full">
            <span class="w-1/10 "> {{ lang[selectedLang].file }}</span>
            <input class="file-input w-full max-w-xs focus:outline-none focus:ring focus:ring-neutral" type="file"
                v-on:change="setMessageAttachment" />

        </label> -->
        <div class="btn-group place-self-end">
            <button class="btn bg-error text-black hover:(bg-accent text-white shadow-md)" @click="show_tickets">
                {{ lang[selectedLang].cancel }}</button>
            <button class="btn bg-primary text-white hover:(bg-accent text-white shadow-md)" @click="createTicket">
                {{ lang[selectedLang].submit }}</button>


        </div>

    </div>
</template>

