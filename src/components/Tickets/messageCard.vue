<template>
    <div class="chat chat-start">


        <div class="chat-image avatar" v-if="this.userData">
            <div class="w-10 rounded-full">
                <img :src='`${this.backendBaseAPI}${this.userData.pfp}`' v-if="this.userData.pfp" />
                <img src='../../assets/3f9470b34a8e3f526dbdb022f9f19cf7.jpg' v-if="!this.userData.pfp" />
            </div>
        </div>
        <div class="chat-image avatar" v-if="!this.userData">
            <div class="w-10 rounded-full">
                <img src="../../assets/360_F_510888200_EentlrpDCeyf2L5FZEeSfgYaeiZ80qAU.jpg">
            </div>
        </div>
        <audio :src="backendBaseAPI + audio" class="box-border h-10 w-64 border-4 " :class="audioColor" v-for="audio in audioList" v-bind:key="audio"
            controls></audio>
        <!-- <a class="hover:cursor-pointer" v-for="audio in audioList" v-bind:key="audio" :href="backendBaseAPI + audio"
            target="_blank">
            
        </a> -->
        <div class="chat-header ">
            {{ message.sender }}
            <time class="text-xs opacity-50">{{formatDate(message.message.created_at)}}</time>
        </div>

        <div :class="chatColor" class="chat-bubble"
            v-if="photoList.length > 0 || videoList.length > 0 || fileList.length > 0 || message.message.content">
            <textarea class="textarea textarea-bordered text-white h-fit w-100 " v-if="isEditActive"
                v-model="lastMessage"></textarea>
            <div style="white-space: pre-wrap;" v-else>
                {{ message.message.content }}<br><span style="color: gray; font-size: 12px; font-style: italic;" v-if="message.message.is_edited">edited</span>
            </div>

            <a class="hover:cursor-pointer" v-for="photo in photoList" v-bind:key="photo" :href="backendBaseAPI + photo"
                target="_blank">
                <img :src="backendBaseAPI + photo" class="box-border h-64 w-64 border-4 border-gray" v-on:load="this.$emit('scroll-to-bottom-chat')"
                v-on:error="this.$emit('scroll-to-bottom-chat')"/>
            </a>
            <a class="hover:cursor-pointer" v-for="video in videoList" v-bind:key="video" :href="backendBaseAPI + video"
                target="_blank">
                <video :src="backendBaseAPI + video" class="box-border h-64 w-64" v-on:load="this.$emit('scroll-to-bottom-chat')"
                 v-on:error="this.$emit('scroll-to-bottom-chat')" controls></video>
            </a>
            <a class="hover:cursor-pointer link" v-for="photo in externalPhotoList" v-bind:key="photo"
                :href="photo" target="_blank">
                <img :src="photo" class="box-border h-64 w-64 border-4 border-gray" v-on:load="this.$emit('scroll-to-bottom-chat')"
                 v-on:error="this.$emit('scroll-to-bottom-chat')"/>
            </a>
            <a class="hover:cursor-pointer link" v-for="video in externalVideoList" v-bind:key="video" 
                :href="video" target="_blank">
                <video :src="video" class="box-border h-64 w-64"  
                v-on:error="this.$emit('scroll-to-bottom-chat')"
                v-on:load="this.$emit('scroll-to-bottom-chat')" controls></video>
            </a>
            <a class="hover:cursor-pointer" v-for="file in fileList" v-bind:key="file" :href="backendBaseAPI + file"
                target="_blank">
                <i class='bx bx-file-blank'></i>
                {{ file }}
            </a>



            <div v-if="showOption">
                <a class=" text-2xl hover:text-2xl mr-2 hover:text-base-300 hover:cursor-pointer" v-if="isEditActive"
                    @click="editMessage()"><i class='bx bx-check'></i></a>
                <a class=" text-xl hover:text-2xl mr-2 hover:text-base-300 hover:cursor-pointer" v-else
                    @click="makeEditActive()"><i class='bx bx-pencil'></i></a>
                <a class=" text-xl hover:text-2xl hover:text-base-300  hover:cursor-pointer" @click="deleteMessage"
                    v-if="highestRole.delete_messages"><i class='bx bx-trash-alt'></i></a>

            </div>
            <!-- <div v-else>
                <a class=" text-xs hover:text-sm hover:font-bold hover:text-base-300  hover:cursor-pointer">reply</a>
            </div> -->
        </div>


    </div>
</template>

<script>
import axios from "axios";


export default {
    name: "ReceivedMessage",
    props: {
        message: Object, 
        userData: Object,
        highestRole: Object

    },
    mounted() {
        
    },
    data() {
        return {
            token: null,
            chatColor: this.message.sender === 'me' ? 'chat-bubble-info' : 'chat-bubble-primary',
            showOption: this.message.sender === 'me' || this.highestRole.update_ticket || this.highestRole.manage_system ? true : false,
            audioColor: this.message.sender === 'me' ? 'border-info' : 'border-primary',

            attachmentAPI: 'https://ticketoapi.liara.run/api/tickets/messages/details/attachment/',
            backendBaseAPI: 'https://ticketoapi.liara.run',
            photoList: [],
            videoList: [],
            externalPhotoList: [],
            externalVideoList: [],
            fileList: [],
            audioList: [],

            isEditActive: false,
            lastMessage: this.message.message.content
        }
    },
    async created() {
        this.token = localStorage.getItem('token')

        await this.fetchAttachment()
        this.fetchMediaURL()
    },
    methods: {

        detectURLs(message) {
            if (message) {
                var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
                return message.match(urlRegex)
            }
        },
        fetchMediaURL() {
            var urls = this.detectURLs(this.lastMessage)
            for (const url of urls) {
                let splited = url.split('/')
                let filename = splited.pop()
                let ft = this.findFileType(filename)
                if(ft === 'picture'){
                    this.externalPhotoList.push(url)
                }
                if(ft === 'video'){
                    this.externalVideoList.push(url)
                }
            }
            this.$emit("scroll-to-bottom-chat")
        },
        findFileType(filename) {
            var ext = filename.split('.').pop();
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
        async fetchAttachment() {

            await axios.get(this.attachmentAPI + this.message.message.id, { headers: { Authorization: `Token ${this.token}` } })
                .then(response => {
                    for (let dm of response.data) {
                        if (dm.media != null) {

                            if (dm.type === 'picture') {
                                this.photoList.push(dm.media)
                            } else if (dm.type === 'video') {
                                this.videoList.push(dm.media)
                            } else if (dm.type === 'other') {
                                this.fileList.push(dm.media)
                            } else if (dm.type === 'audio') {
                                this.audioList.push(dm.media)
                            }

                        }

                    }
                })
                .catch(error => {
                    console.log(error)
                })


        },
        formatDate(date) {
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var date = new Date(date)
            var currentDate = new Date()
            const diffTime = Math.abs(currentDate - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if(diffDays < 1){
                return `Today ${date.getHours()}:${date.getMinutes()}`
            }
            else if(diffDays == 1){
                return `Yesterday ${date.getHours()}:${date.getMinutes()}`
            }
            return `${date.toLocaleString("en-US", options)} ${date.getHours()}:${date.getMinutes()}`
        },
        async deleteMessage(mid) {
            this.$emit('deleteMessage', this.message.message.id)
        },
        makeEditActive() {
            this.isEditActive = true
        },
        async editMessage(mid) {
            this.isEditActive = false
            this.$emit('editMessage', this.message.message.id, this.lastMessage)
        }

    }

}
</script>

<style scoped></style>