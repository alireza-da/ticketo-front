<script>

import messagecard from "@/components/Tickets/messageCard.vue";
import axios from 'axios';
import { ref } from "vue";

export default {
    name: "TicketPage",
    components: { messagecard },
    props: {
        ticket: {
            type: Object,
            default: null
        },
        systems: {
            type: Object,
            default: null
        },
        lang: Object,
        selectedLang: String
    },
    methods: {
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
        close_ticket_page() {
            this.$emit('close_ticket_page')
        },
        fetchTicketData() {
            this.ticketID = this.$props.ticket.id
            this.username = this.$props.ticket.ticketOwner.name
            this.userPfp = this.$props.ticket.ticketOwner.pfp
            this.ticketName = this.$props.ticket.name
            this.ticketCategory = this.$props.ticket.category[0].name
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var date = new Date(this.$props.ticket.created_at)

            this.ticketStartDate = date.toLocaleString("en-US", options)
            this.ticketStatus = this.$props.ticket.status
            this.ticketIsClosed = this.$props.ticket.is_closed
            // this.ticketSupervisors = this.ticket.supervisors

        },
        async fetchSysUsers() {
            await axios.get(`${this.usersSystemAPI}${this.$props.ticket.sys_id}`, { headers: { "Authorization": `Token ${this.token}` } }).then((response) => {
                this.sysUsers = response.data
            })
        },
        getUserById(uid) {
            for (const u of this.sysUsers) {
                if (u.id === uid) {
                    return u
                }
            }
        },
        async fetchTicketMembers() {
            await axios.get(`${this.ticketRolesDetails}${this.$props.ticket.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.users = []
                for (const r of res.data) {
                    await axios.get(`${this.userDetailsAPI}${r.user_id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                        this.users.push(res.data)
                        this.roles[res.data.id] = r
                        this.roleReadMessage = r.read_messages
                        this.roleWriteMessage = r.write_messages
                        this.roleDeleteMessage = r.delete_messages
                        this.roleReadHistory = r.read_history
                        this.roleUploadMedia = r.upload_media
                        this.roleDeleteTicket = r.delete_ticket
                        this.roleCreateTicket = r.create_ticket
                        this.roleUpdateTicket = r.update_ticket
                        this.roleManageSystem = r.manage_system
                        this.roleManageRoles = r.manage_role
                        this.roleManageMembers = r.manage_members
                    })

                }
            })
        },
        findHighestRole(uid) {
            if (this.roles[uid]) {
                return this.roles[uid]
            }
            return null
        },
        async removeUserFromTicket(uid) {
            await axios.delete(`${this.ticketRolesMainDetailsAPI}${this.roles[uid].id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: 'foo',
                    title: 'Success',
                    text: 'User has been removed from ticket'
                })
                this.fetchTicketData()
                await this.fetchTicketMembers()
            })
        },
        async updateTicketRole(tr) {
            console.log({
                read_messages: this.roleReadMessage,
                write_messages: this.roleWriteMessage,
                delete_messages: this.roleDeleteMessage,
                read_history: this.roleReadHistory,
                upload_media: this.roleUploadMedia,
                delete_ticket: this.roleDeleteTicket,
                create_ticket: this.roleCreateTicket,
                update_ticket: this.roleUpdateTicket,
                manage_system: this.roleManageSystem,
                manage_role: this.roleManageRoles,
                manage_members: this.roleManageMembers
            });
            await axios.put(`${this.ticketRolesMainDetailsAPI}${tr.id}`, {
                sys_id: tr.sys_id,
                name: tr.name,
                t_id: tr.t_id,
                read_messages: this.roleReadMessage,
                write_messages: this.roleWriteMessage,
                delete_messages: this.roleDeleteMessage,
                read_history: this.roleReadHistory,
                upload_media: this.roleUploadMedia,
                delete_ticket: this.roleDeleteTicket,
                create_ticket: this.roleCreateTicket,
                update_ticket: this.roleUpdateTicket,
                manage_system: this.roleManageSystem,
                manage_role: this.roleManageRoles,
                manage_members: this.roleManageMembers
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: 'foo',
                    title: 'Succes',
                    text: 'Role has been updated'
                })
                this.fetchTicketData()
                await this.fetchTicketMembers()
            }).catch(err => {
                this.$notify({
                    group: 'error',
                    title: 'Error',
                    text: 'Error while updating'
                })
            })
        },
        async addUserToTicket(uid) {
            await axios.post(`${this.ticketRoleListAPI}`, {
                "user_id": uid,
                "sys_id": this.$props.ticket.sys_id,
                "name": "Default",
                "t_id": this.$props.ticket.id,
                "is_creator": false,
                "read_messages": true,
                "write_messages": true,
                "delete_messages": false,
                "read_history": true,
                "upload_media": true
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: 'foo',
                    title: 'Succes',
                    text: 'User has been added'
                })
                await this.fetchSysUsers()
                await this.fetchTicketData()
                await this.fetchTicketMembers()
            })

        },
        async fetchUserData() {
            await axios.get(`${this.userAPI}`, { headers: { 'Authorization': `Token ${this.token}` } }).then((response) => {
                this.userData = response.data
            })
        },
        async fetchUserHR() {
            var hr = this.findHighestRole(this.userData.id)
            this.clientCreateTicket = hr.create_ticket
            this.clientDeleteMessage = hr.delete_messages
            this.clientDeleteTicket = hr.delete_ticket
            this.clientManageRoles = hr.manage_role
            this.clientManageMembers = hr.manage_members
            this.clientManageSystem = hr.manage_system
            this.clientReadHistory = hr.read_history
            this.clientReadMessage = hr.read_messages
            this.clientUpdateTicket = hr.update_ticket
            this.clientUploadMedia = hr.upload_media
            this.clientWriteMessage = hr.write_messages
        },
        async closeTicket() {
            await axios.put(`${this.ticketDetailsAPI}${this.$props.ticket.id}`, {
                sys_id: this.$props.ticket.sys_id,
                is_closed: true,
                name: this.$props.ticket.name
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: 'foo',
                    title: 'Succes',
                    text: 'Ticket has been updated'
                })
                this.ticketStatus = "Closed"
            })

        },
        async openTicket() {
            await axios.put(`${this.ticketDetailsAPI}${this.$props.ticket.id}`, {
                sys_id: this.$props.ticket.sys_id,
                is_closed: false,
                name: this.$props.ticket.name
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: 'foo',
                    title: 'Succes',
                    text: 'Ticket has been updated'
                })
                this.ticketStatus = "Open"
            })

        },
        async safeDeleteTicket() {
            await axios.put(`${this.ticketDetailsAPI}${this.$props.ticket.id}`, {
                sys_id: this.$props.ticket.sys_id,
                is_deleted: true,
                name: this.$props.ticket.name
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: 'foo',
                    title: 'Succes',
                    text: 'Ticket has been updated'
                })
                this.ticketStatus = "Deleted"
                location.reload()
            })
        },
        async fetchMessage() {
            this.messageList = []
            this.finalMessageList = []
            this.doneFetchingChat = false
            await axios.get(`${this.ticketMessagesAPI}${this.$props.ticket.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.messageList = res.data
            })

            for (let msg of this.messageList) {
                if (msg.user_id == this.userData.id) {
                    this.finalMessageList.push({
                        sender: "Me",
                        message: msg
                    })
                } else {
                    if (msg.user_id)
                        this.finalMessageList.push({
                            sender: this.getUserById(msg.user_id).name,
                            message: msg
                        })
                    else
                        this.finalMessageList.push({
                            sender: "System",
                            message: msg
                        })
                }
            }
            this.doneFetchingChat = true
        },
        async getUser(msg) {
            console.log(msg);
            let result
            if (msg.user_id)
                await axios.get(`${this.userDetailsAPI}${msg.user_id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                    result = res
                })
            else
                result = { name: "System" }
            console.log(result);
            return result
        },
        async fetchSys() {
            for (const s of this.$props.systems) {
                if (this.$props.ticket.sys_id === s.id) {
                    this.system = s
                }
            }
        },
        async deleteMessage(mid) {

            await axios.delete(`${this.deleteMessageAPI}${mid}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.$notify({
                    group: 'foo',
                    title: 'Success',
                    text: 'Message has been deleted'
                })

            })
            await this.fetchMessage()
        },
        async editMessage(mid, editMessageText) {
            await axios.put(`${this.deleteMessageAPI}${mid}`, {
                "content": editMessageText
            }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.$notify({
                    group: 'foo',
                    title: 'Success',
                    text: 'Message has been edited'
                })
            })
            await this.fetchMessage()
        },
        async createMessage() {
            await axios.post(`${this.createMessageAPI}`, {

                content: this.sendingMessage,
                user_id: this.userData.id,
                ticket_id: this.$props.ticket.id,


            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.sendingMessage = ""
                await this.fetchMessage()
            })

        },
        async sendPm(pm) {
            await axios.post(`${this.createMessageAPI}`, {
                content: pm.content,
                ticket_id: this.$props.ticket.id

            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                await this.fetchMessage()
            })

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

        async sendNewMessage() {
            this.recordingState === 0
            // post message
            await axios.post(`${this.createMessageAPI}`, {
                content: this.sendingMessage,
                user_id: this.userData.id,
                ticket_id: this.$props.ticket.id,

            }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {

                this.sendingMessage = res.data

            })
            // post attachment
            if (this.msgAttachment) {
                await axios.post(`${this.attachmentListAPI}`, {
                    "message_id": this.sendingMessage.id,
                    "media": this.msgAttachment,
                    "type": this.findFileType(this.msgAttachment)
                }, {
                    headers: {
                        Authorization: `Token ${this.token}`,
                        "Content-Type": 'multipart/form-data'
                    }
                }).then(res => {

                })
            }
            await this.fetchMessage()
            this.sendingMessage = null
            this.msgAttachment = null


        },
        async stopAudioRecording() {
            this.mediaRecorder.stop();
        },
        async startAudioRecording() {
            var mediaRecorder;
            if (this.recordingState === 0) {
                this.recordingState++
                let audioIN = { audio: true };
                //  audio is true, for recording

                // Access the permission for use
                // the microphone

                navigator.mediaDevices.getUserMedia(audioIN)
                    .then((mediaStreamObj) => {
                        // Connect the media stream to the
                        // first audio element
                        let audio = document.querySelector('audio');
                        let playAudio = document.querySelector('audio');
                        playAudio.pause()
                        //returns the recorded audio via 'audio' tag

                        // 'srcObject' is a property which
                        // takes the media object
                        // This is supported in the newer browsers
                        if ("srcObject" in audio) {
                            audio.srcObject = mediaStreamObj;
                        }
                        else {   // Old version
                            audio.src = window.URL
                                .createObjectURL(mediaStreamObj);
                        }

                        // It will play the audio
                        // audio.onloadedmetadata = function (ev) {

                        //     // Play the audio in the 2nd audio
                        //     // element what is being recorded
                        //     audio.play();
                        // };

                        // This is the main thing to recorded
                        // the audio 'MediaRecorder' API
                        mediaRecorder = new MediaRecorder(mediaStreamObj);
                        // Pass the audio stream
                        // Start event
                        mediaRecorder.start();

                        // If audio data available then push
                        // it to the chunk array
                        mediaRecorder.ondataavailable = function (ev) {
                            dataArray.push(ev.data);
                        }

                        // Chunk array to store the audio data
                        let dataArray = [];

                        // Convert the audio data in to blob
                        // after stopping the recording
                        mediaRecorder.onstop = async (ev) => {

                            // blob of type mp3
                            let audioData = new Blob(dataArray,
                                { 'type': 'audio/mp3;' });

                            // After fill up the chunk
                            // array make it empty
                            dataArray = [];

                            // Creating audio url with reference
                            // of created blob named 'audioData'
                            let audioSrc = window.URL
                                .createObjectURL(audioData);

                            this.audioData = audioData
                            var file = new File([this.audioData], "sample.mp3");
                            this.msgAttachment = file
                            await this.sendNewMessage()
                            // Pass the audio url to the 2nd video tag
                            playAudio.src = audioSrc;
                        }
                        this.mediaRecorder = mediaRecorder
                    })

                    // If any error occurs then handles the error
                    .catch(function (err) {
                        console.log(err.name, err.message);
                    });

            }
            else if (this.recordingState === 1) {
                await this.stopAudioRecording()
                this.recordingState = 0
                // this.recordingState++
            }
            // else if (this.recordingState === 2) {
            //     let playAudio = document.querySelector('audio');
            //     playAudio.play()
            //     this.recordingState = 0
            // }
        },
        openInNewWindow() {
            window.open(document.URL, '_blank', 'location=yes,height=720,width=1360,scrollbars=yes,status=yes');
        },
        async fetchPms() {
            await axios.get(`${this.predefinedMessageSystemAPI}${this.system.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.predefinedMessages = res.data
            })
        },
    },

    watch: {
        ticket(newTicket) {
            this.username = newTicket.ticketOwner.name
        }
    },
    async created() {
        this.token = localStorage.getItem('token')
        await this.fetchUserData()
        this.fetchTicketData()
        await this.fetchSys()
        await this.fetchTicketMembers()
        await this.fetchSysUsers()
        await this.fetchMessage()
        await this.fetchUserHR()
        await this.fetchPms()
    },
    data() {
        return {
            userData: null,
            username: "Username",
            userPfp: "",
            ticketName: "Ticket Name",
            ticketID: 0,
            ticketCategory: "Ticket Category",
            ticketStartDate: "Ticket Start Date",
            lastReplyDate: "Last Reply Date",
            ticketStatus: "Ticket Status",
            ticketSupervisors: "Ticket Supervisors",
            ticketIsClosed: false,
            users: [],
            sysUsers: [],
            roles: {},
            predefinedMessages: [],
            token: null,
            system: null,
            // APIs
            ticketRolesDetails: 'https://ticket-backend.iran.liara.run/api/tickets/roles/details/', // tid
            userDetailsAPI: 'https://ticket-backend.iran.liara.run/api/users/details/', // uid
            ticketRolesMainDetailsAPI: 'https://ticket-backend.iran.liara.run/api/ticketsroles/details/', // pk
            ticketsAddAPI: 'https://ticket-backend.iran.liara.run/api/tickets/add/', // tid, uid
            ticketRoleListAPI: 'https://ticket-backend.iran.liara.run/api/tickets/roles/list/',
            usersSystemAPI: 'https://ticket-backend.iran.liara.run/api/systems/details/users/',
            userAPI: "https://ticket-backend.iran.liara.run/api/users/details/ata/", // e.g https://ticket-backend.iran.liara.run/api/users/details/1
            ticketDetailsAPI: 'https://ticket-backend.iran.liara.run/api/tickets/details/', // tid
            referralLinkURL: 'https://ticket.sunrp.ir/tickets/',
            predefinedMessageSystemAPI: 'https://ticket-backend.iran.liara.run/api/system/predefinedmsg/', // sysid
            // ticket role data
            roleReadMessage: false,
            roleWriteMessage: false,
            roleDeleteMessage: false,
            roleReadHistory: false,
            roleUploadMedia: false,
            roleDeleteTicket: false,
            roleCreateTicket: false,
            roleUpdateTicket: false,
            roleManageSystem: false,
            roleManageRoles: false,
            roleManageMembers: false,
            ticketMessagesAPI: 'https://ticket-backend.iran.liara.run/api/tickets/messages/details/', // tid
            deleteMessageAPI: 'https://ticket-backend.iran.liara.run/api/messages/details/', // mid
            createMessageAPI: 'https://ticket-backend.iran.liara.run/api/tickets/messages/list/', // tid
            attachmentListAPI: 'https://ticket-backend.iran.liara.run/api/tickets/messages/details/attachment/list/',
            messageList: null,
            finalMessageList: ref([]),
            // permission view
            clientReadMessage: false,
            clientWriteMessage: false,
            clientDeleteMessage: false,
            clientReadHistory: false,
            clientUploadMedia: false,
            clientDeleteTicket: false,
            clientCreateTicket: false,
            clientUpdateTicket: false,
            clientManageSystem: false,
            clientManageRoles: false,
            clientManageMembers: false,
            // sending message data
            sendingMessage: null,
            msgAttachment: null,
            // voice message 
            mediaRecorder: null,
            recordingState: 0,
            audioData: null,
            // loading states
            doneFetchingChat: false,
        }

    }
}
</script>

<template>
    <div class="flex place-items-start h-full" style=" height: 100%">
        <audio></audio>
        <button class="btn w-full h-full loading absolute inset-0" v-if="!doneFetchingChat">loading</button>
        <div class="flex  grow h-full " v-if="doneFetchingChat">

            <!--            User Info-->
            <div class="card flex-shrink-0 shadow-2xl bg-base-100 w-1.4/5 h-fit" style="margin-left: 25px">
                <div class="card-body min-h-full ">
                    <div class="avatar mb-5">
                        <div class="w-24 rounded-full">
                            <img src="../../assets/Icons/user_icon.png" v-if="userPfp.length == 0" />
                            <img :src="`https://ticket-backend.iran.liara.run${userPfp}`"  v-else/>
                        </div>
                        <div class="grid place-self-end text-xl" style="margin-left: 10px">
                            <h3 class="" style="margin-top: 30%">{{ username }}</h3>
                        </div>

                    </div>
                    <div class="">
                        <div class="grid grid-cols-1">
                            <div class="text-start">
                                <div class="grid grid-cols-2">
                                    <h3 class="text-1xl font-bold"> {{ lang[selectedLang].ticketname }} : </h3>
                                    <p>{{ ticketName }}</p>
                                </div>
                                <br>
                                <h3 class="text-lg font-light"> {{ lang[selectedLang].ticketinfo }} </h3>

                                <br>
                                <div class="grid grid-cols-2">

                                    <h3 class="text-1xl "> {{ lang[selectedLang].category }} : </h3>
                                    <p>{{ ticketCategory }}</p>
                                </div>
                                <div class="grid grid-cols-2">
                                    <h3 class="text-1xl "> {{ lang[selectedLang].system }} : </h3>
                                    <p>{{ system.name }}</p>

                                </div>

                                <div class="grid grid-cols-2">
                                    <h3 class="text-1xl "> {{ lang[selectedLang].startdate }} : </h3>
                                    <p>{{ ticketStartDate }}</p>

                                </div>
                                <div class="grid grid-cols-2">
                                    <h3 class="text-1xl "> {{ lang[selectedLang].referrallink }} : </h3>
                                    <a class="link link-accent" :href="`${referralLinkURL}${ticketName}/${ticketID}`">{{
                                        referralLinkURL }}{{ ticketName }}/{{ ticketID }}</a>

                                </div>
                                <br>
                                <!-- <div class="grid grid-cols-2">
                                    <h3 class="text-1xl ">Last Reply : </h3>
                                    <p>{{ lastReplyDate }}</p>

                                </div> -->
                                <br>
                                <div class="grid grid-cols-2 ">

                                    <h3 class="text-1xl text-sm"> {{ lang[selectedLang].status }} : </h3>
                                    <p>{{ ticketStatus }}</p>

                                </div>
                                <br>
                                <div class="grid grid-cols-6 btn-group">

                                    <button class="btn btn-outline btn-accent " @click="close_ticket_page()">
                                        <i class='bx bx-arrow-back mr-1'></i>{{ lang[selectedLang].back }}</button>
                                    <button class="btn btn-outline btn-accent " @click="safeDeleteTicket"
                                        v-if="clientDeleteTicket">
                                        <i class='bx bx-trash'></i>{{ lang[selectedLang].Delete }}</button>
                                    <button class="btn btn-outline btn-accent " @click="openTicket"
                                        v-if="clientManageSystem || clientUpdateTicket">
                                        <i class='bx bxs-envelope-open mr-1'></i>{{ lang[selectedLang].open }}</button>
                                    <label v-if="clientManageSystem || clientUpdateTicket || clientManageRoles"
                                        class="btn btn-accent btn-outline" for="ticket-members-modal">
                                        <i class='bx bxs-user-account mr-1'></i>{{ lang[selectedLang].member }}</label>
                                    <input id="ticket-members-modal" class="modal-toggle" type="checkbox" />
                                    <div class="modal modal-bottom lg:modal-middle w-full">
                                        <div class="modal-box w-11/12 max-w-7xl">
                                            <h3 class="font-bold text-lg"> {{ lang[selectedLang].ticketuserpannel }}</h3>

                                            <div class="modal-action justify-start mb-2">
                                                <!-- <label for="user-manage-modal"
                                                                                                                                                class="btn bg-primary text-white hover:(bg-accent)">search</label> -->
                                                <input id="usersSearchInput" class="input input-ghost w-full max-w-xs"
                                                    :placeholder="lang[selectedLang].search" type="text"
                                                    @keyup="searchTable('usersTable', 'usersSearchInput')" />
                                                <button class="btn btn-square">
                                                    <svg class="h-6 w-6" fill="none" stroke="currentColor"
                                                        viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                            stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div class="overflow-auto w-full">
                                                <table id="usersTable" class="table w-full">
                                                    <!-- head -->
                                                    <thead>
                                                        <tr>
                                                            <th> {{ lang[selectedLang].name }}</th>
                                                            <th> {{ lang[selectedLang].role }}</th>
                                                            <th> {{ lang[selectedLang].email }}</th>
                                                            <th> {{ lang[selectedLang].steamhex }}</th>
                                                            <th> {{ lang[selectedLang].discordid }}</th>
                                                            <th> {{ lang[selectedLang].actions }}</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <!-- row 1 -->
                                                        <tr v-for="user in users" v-bind:key="user.id">
                                                            <td>
                                                                <div class="flex items-center space-x-3">
                                                                    <div class="avatar">
                                                                        <div class="mask mask-squircle w-12 h-12">
                                                                            <img :src="`https://ticket-backend.iran.liara.run${user.pfp}`"
                                                                                v-if="user.pfp" alt="Avatar" />
                                                                            <img alt="Avatar" v-else
                                                                                src="../../assets/3f9470b34a8e3f526dbdb022f9f19cf7.jpg" />

                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div class="font-bold">{{ user.name }}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td class="">


                                                                <span v-if="findHighestRole(user.id)"
                                                                    class="badge badge-ghost badge-sm">{{
                                                                        findHighestRole(user.id).name
                                                                    }}
                                                                    - {{ findHighestRole(user.id).level }}</span>
                                                            </td>
                                                            <td>{{ user.email }}</td>
                                                            <td>{{ user.steam_hex }}</td>
                                                            <td>{{ user.discord_id }}</td>
                                                            <th>
                                                                <label :for="`delete-user-modal${user.id}`"
                                                                    class="btn btn-ghost btn-xs bg-error"><i
                                                                        class='bx bx-user-x mr-2'></i>
                                                                    {{ lang[selectedLang].remove }}</label>
                                                                <input :id="`delete-user-modal${user.id}`"
                                                                    class="modal-toggle" type="checkbox" />
                                                                <div class="modal">
                                                                    <div class="modal-box w-11/12 max-w-5xl">
                                                                        <h3 class="font-bold text-lg">
                                                                            {{ lang[selectedLang].warning }}!</h3>
                                                                        <p class="py-4">You're about to delete a user from a
                                                                            ticket! This
                                                                            action
                                                                            cannot be undone. Do it on your
                                                                            own risk.</p>
                                                                        <div class="modal-action">
                                                                            <label :for="`delete-user-modal${user.id}`"
                                                                                class="btn bg-error text-black hover:(bg-accent)"
                                                                                @click="removeUserFromTicket(user.id)">
                                                                                {{ lang[selectedLang].Delete }}</label>
                                                                            <label :for="`delete-user-modal${user.id}`"
                                                                                class="btn bg-primary text-white hover:(bg-accent)">{{
                                                                                    lang[selectedLang].close }}</label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <label :for="`roles-user-modal${user.id}`"
                                                                    class="btn btn-ghost btn-xs bg-primary"><i
                                                                        class='bx bxs-mask mr-2'></i>
                                                                    {{ lang[selectedLang].role }}</label>
                                                                <input :id="`roles-user-modal${user.id}`"
                                                                    class="modal-toggle" type="checkbox" />
                                                                <div class="modal">
                                                                    <div class="modal-box w-11/12 max-w-5xl">
                                                                        <h3 class="font-bold text-lg">
                                                                            {{ lang[selectedLang].userrole }}</h3>
                                                                        <div
                                                                            class="grid grid-cols-6 overflow-auto justify-center">
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].readmsg }}</span>
                                                                                <input v-model="roleReadMessage"
                                                                                    :placeholder="findHighestRole(user.id).read_messages"
                                                                                    checked="checked"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].writemsg }}</span>
                                                                                <input v-model="roleWriteMessage"
                                                                                    :placeholder="findHighestRole(user.id).write_messages"
                                                                                    checked="checked"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].deletemsg
                                                                                    }}</span>
                                                                                <input v-model="roleDeleteMessage"
                                                                                    :placeholder="findHighestRole(user.id).delete_messages"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].readhistory
                                                                                    }}</span>
                                                                                <input v-model="roleReadHistory"
                                                                                    :placeholder="findHighestRole(user.id).read_history"
                                                                                    checked="checked"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>

                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].uploadmedia
                                                                                    }}</span>
                                                                                <input v-model="roleUploadMedia"
                                                                                    :placeholder="findHighestRole(user.id).upload_media"
                                                                                    checked="checked"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].deleteticket
                                                                                    }}</span>
                                                                                <input v-model="roleDeleteTicket"
                                                                                    :placeholder="findHighestRole(user.id).delete_ticket"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].updateticket
                                                                                    }}</span>
                                                                                <input v-model="roleUpdateTicket"
                                                                                    :placeholder="findHighestRole(user.id).update_ticket"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].createticket
                                                                                    }}</span>
                                                                                <input v-model="roleCreateTicket"
                                                                                    :placeholder="findHighestRole(user.id).create_ticket"
                                                                                    checked="checked"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].managesystem
                                                                                    }}</span>
                                                                                <input v-model="roleManageSystem"
                                                                                    :placeholder="findHighestRole(user.id).manage_system"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].managerole
                                                                                    }}</span>
                                                                                <input v-model="roleManageRoles"
                                                                                    :placeholder="findHighestRole(user.id).manage_role"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>
                                                                            <label
                                                                                class="label cursor-pointer justify-start">
                                                                                <span class="label-text">
                                                                                    {{ lang[selectedLang].managemember
                                                                                    }}</span>
                                                                                <input v-model="roleManageMembers"
                                                                                    :placeholder="findHighestRole(user.id).manage_members"
                                                                                    class="checkbox checkbox-primary ml-2"
                                                                                    type="checkbox" />
                                                                            </label>

                                                                        </div>

                                                                        <div class="modal-action">
                                                                            <label :for="`roles-user-modal${user.id}`"
                                                                                class="btn bg-primary text-white hover:(bg-accent)"
                                                                                @click="updateTicketRole(findHighestRole(user.id))">
                                                                                {{ lang[selectedLang].update }}</label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </th>
                                                        </tr>
                                                    </tbody>


                                                </table>
                                            </div>
                                            <div class="modal-action">
                                                <label class="btn bg-success text-black hover:(text-white)"
                                                    for="ticket-members-modal"> {{ lang[selectedLang].save }}
                                                    <i class='bx bxs-save ml-2'></i></label>
                                                <label class="btn bg-success text-black hover:(text-white)"
                                                    for="add-members-modal"> {{ lang[selectedLang].addmember }}<i
                                                        class='bx bxs-user ml-2'></i></label>
                                                <label class="btn bg-red text-black hover:(text-white)"
                                                    for="ticket-members-modal"> {{ lang[selectedLang].close }}<i
                                                        class='bx bx-x ml-2'></i></label>
                                                <input id="add-members-modal" class="modal-toggle" type="checkbox" />
                                                <div class="modal modal-bottom lg:modal-middle w-full">
                                                    <div class="modal-box w-11/12 max-w-7xl">
                                                        <h3 class="font-bold text-lg">
                                                            {{ lang[selectedLang].ticketuserpannel }}</h3>

                                                        <div class="modal-action justify-start mb-2">
                                                            <!-- <label for="user-manage-modal"
                                                                                                                                                class="btn bg-primary text-white hover:(bg-accent)">search</label> -->
                                                            <input id="sysUsersSearchInput"
                                                                class="input input-ghost w-full max-w-xs"
                                                                :placeholder="lang[selectedLang].search" type="text"
                                                                @keyup="searchTable('sysUsersTable', 'sysUsersSearchInput')" />
                                                            <button class="btn btn-square">
                                                                <svg class="h-6 w-6" fill="none" stroke="currentColor"
                                                                    viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                                        stroke-linecap="round" stroke-linejoin="round"
                                                                        stroke-width="2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <div class="overflow-auto w-full">
                                                            <table id="sysUsersTable" class="table w-full">
                                                                <!-- head -->
                                                                <thead>
                                                                    <tr>
                                                                        <th>
                                                                            <label>
                                                                                <input class="checkbox" type="checkbox" />
                                                                            </label>
                                                                        </th>
                                                                        <th> {{ lang[selectedLang].name }}</th>
                                                                        <th> {{ lang[selectedLang].role }}</th>
                                                                        <th> {{ lang[selectedLang].email }}</th>
                                                                        <th> {{ lang[selectedLang].steamhex }}</th>
                                                                        <th> {{ lang[selectedLang].discordid }}</th>
                                                                        <th> {{ lang[selectedLang].actions }}</th>
                                                                        <th></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <!-- row 1 -->
                                                                    <tr v-for="user in sysUsers" v-bind:key="user.id">
                                                                        <th>
                                                                            <label>
                                                                                <input class="checkbox" type="checkbox" />
                                                                            </label>
                                                                        </th>
                                                                        <td>
                                                                            <div class="flex items-center space-x-3">
                                                                                <div class="avatar">
                                                                                    <div
                                                                                        class="mask mask-squircle w-12 h-12">
                                                                                        <img alt="Avatar Tailwind CSS Component"
                                                                                            src="../../assets/3f9470b34a8e3f526dbdb022f9f19cf7.jpg" />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div class="font-bold">{{ user.name }}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td class="">


                                                                            <span v-if="findHighestRole(user.id)"
                                                                                class="badge badge-ghost badge-sm">{{
                                                                                    findHighestRole(user.id).name
                                                                                }}
                                                                                - {{
                                                                                    findHighestRole(user.id).level
                                                                                }}</span>
                                                                        </td>
                                                                        <td>{{ user.email }}</td>
                                                                        <td>{{ user.steam_hex }}</td>
                                                                        <td>{{ user.discord_id }}</td>
                                                                        <th>
                                                                            <label :for="`delete-user-modal${user.id}`"
                                                                                class="btn btn-ghost btn-xs bg-success text-black"
                                                                                @click="addUserToTicket(user.id)"><i
                                                                                    class='bx bx-user-x mr-2'></i>
                                                                                {{ lang[selectedLang].add }}</label>


                                                                        </th>
                                                                    </tr>
                                                                </tbody>


                                                            </table>
                                                        </div>
                                                        <div class="modal-action">
                                                            <label class="btn bg-success text-black hover:(text-white)"
                                                                for="add-members-modal"> {{ lang[selectedLang].savechange
                                                                }}<i class='bx bxs-save ml-2'></i></label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    <label class="btn btn-outline btn-accent " for="close-ticket-modal"><i
                                            class='bx bx-window-close mr-1'></i>{{ lang[selectedLang].close }}</label>
                                    <input type="checkbox" id="close-ticket-modal" class="modal-toggle" />
                                    <div class="modal">
                                        <div class="modal-box">
                                            <h3 class="font-bold text-lg">Warning</h3>
                                            <p class="py-4">{{ lang[selectedLang].closeticketwarnmsg }}</p>
                                            <div class="modal-action">
                                                <label for="close-ticket-modal" class="btn btn-success hover:()" @click="closeTicket">{{lang[selectedLang].close}}</label>
                                                <label for="close-ticket-modal" class="btn btn-error">{{lang[selectedLang].cancel}}</label>
                                            </div>
                                        </div>
                                    </div>
                                    <button class="btn btn-outline btn-accent" @click="openInNewWindow"><i
                                            class='bx bx-window-open'></i>{{ lang[selectedLang].popout }}
                                    </button>

                                </div>

                            </div>

                        </div>
                    </div>


                </div>

            </div>
            <!--Chat-->
            <div class="divider divider-horizontal"></div>
            <div class="text-center lg:text-left  grow h-full overflow-auto align-bottom">
                <div class="relative h-full w-full">
                    <div v-if="(clientReadHistory || clientReadMessage)"
                        class="overflow-y-scroll max-h-4.7/5  w-full absolute  bottom-15">

                        <messagecard v-for="message in finalMessageList" v-bind:key="message.id" :message="message"
                            :userData="getUserById(message.message.user_id)" @deleteMessage="deleteMessage"
                            @editMessage="editMessage" :highestRole="findHighestRole(userData.id)">

                        </messagecard>
                    </div>
                </div>

                <div v-if="clientWriteMessage && ticketStatus !== 'Closed'"
                    class="w-full flex max-h-1/5 object-bottom inset-x-0 bottom-0 absolute ">
                    <a v-if="clientUploadMedia" class="btn btn-circle btn-outline btn-accent" for="uploadFile"
                        href="https://uupload.ir/" target="_blank">
                        <i class='bx bx-cloud-upload lg text-xl'> </i>
                    </a>
                    <label v-if="clientUploadMedia" class="btn btn-circle btn-outline btn-accent"
                        @click="startAudioRecording">
                        <i class='bx bxs-microphone lg text-xl' v-if="recordingState === 0"></i>
                        <i class='bx bxs-circle lg text-xl' v-if="recordingState === 1"></i>
                        <i class='bx bx-play lg text-xl' v-if="recordingState === 2"></i>
                    </label>
                    <!--Predefined Messages-->
                    <label class="btn btn-circle btn-outline btn-accent" for="sys-prdefinedmsg-modal"><i
                            class='bx bxs-comment-add lg text-xl'></i></label>
                    <input type="checkbox" id="sys-prdefinedmsg-modal" class="modal-toggle" />
                    <div class="modal">

                        <div class="modal-box w-11/12 max-w-5xl">

                            <h3 class="font-bold text-lg">{{ lang[selectedLang].protocolMessages }}</h3>
                            <input type="text" placeholder="Search" class="input w-full max-w-xs mb-5" id="predefmsgsearch"
                                @keyup="searchTable('predefmsgTable', 'predefmsgsearch')" />
                            <table class="table w-full" id="predefmsgTable">
                                <!-- head -->
                                <thead>
                                    <tr>
                                        <th> {{ lang[selectedLang].title }}</th>
                                        <th> {{ lang[selectedLang].content }}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- row 1 -->
                                    <tr v-for="pm in predefinedMessages" v-bind:key="pm.id">
                                        <td>
                                            <div class="flex items-center space-x-3">
                                                <div>
                                                    <div class="font-bold">{{ pm.title }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="flex items-center space-x-3">
                                                <div>
                                                    <div class="font-bold">{{ pm.content }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <th>

                                            <label class="btn btn-ghost btn-xs bg-primary" @click="sendPm(pm)"
                                                for="sys-prdefinedmsg-modal"><i class='bx bxs-edit-alt mr-2'></i>
                                                {{ lang[selectedLang].send }}</label>

                                        </th>
                                        <!-- <input type="checkbox" :id="`edit-pm-modal${pm.id}`" class="modal-toggle" />
                                        <div class="modal modal-bottom lg:modal-middle w-full overflow-auto h-full">
                                            <div class="modal-box w-11/12 max-w-7xl">

                                            </div>
                                        </div> -->
                                    </tr>
                                </tbody>

                            </table>
                            <div class="modal-action">
                                <label for="sys-prdefinedmsg-modal" class="btn bg-red text-black hover:(bg-error)">{{
                                    lang[selectedLang].close }}</label>
                            </div>

                        </div>
                    </div>


                    <input class="mr-1" id="uploadFile" style="width: 0px ; height:0px" type="file"
                        v-on:change="setMessageAttachment">
                    <input v-model="sendingMessage" class="input input-bordered grow"
                        :placeholder="lang[selectedLang].addyourmessage" type="text" />
                    <button class="btn btn-outline btn-success" @click="sendNewMessage"> {{ lang[selectedLang].send }} <i
                            class='bx bxs-send' style="padding-left: 3px "></i>
                    </button>
                </div>
            </div>

        </div>
    </div>
</template>
