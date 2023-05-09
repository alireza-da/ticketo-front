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
        <audio :src="backendBaseAPI + audio" class="box-border h-10 w-64" v-for="audio in audioList" v-bind:key="audio"
            controls></audio>
        <!-- <a class="hover:cursor-pointer" v-for="audio in audioList" v-bind:key="audio" :href="backendBaseAPI + audio"
            target="_blank">
            
        </a> -->
        <div class="chat-header ">

            {{ message.sender }}
            <time class="text-xs opacity-50">12:45</time>
        </div>

        <div :class="chatColor" class="chat-bubble"
            v-if="photoList.length > 0 || videoList.length > 0 || fileList.length > 0 || message.message.content">
            <textarea class="textarea textarea-bordered text-white h-fit w-100 " v-if="isEditActive"
                v-model="lastMessage"></textarea>
            <div v-else>
                {{ message.message.content }}
            </div>

            <a class="hover:cursor-pointer" v-for="photo in photoList" v-bind:key="photo" :href="backendBaseAPI + photo"
                target="_blank">
                <img :src="backendBaseAPI + photo" class="box-border h-64 w-64 border-4 border-gray" />
            </a>
            <a class="hover:cursor-pointer" v-for="video in videoList" v-bind:key="video" :href="backendBaseAPI + video"
                target="_blank">
                <video :src="backendBaseAPI + video" class="box-border h-64 w-64" controls></video>
            </a>
            <a class="hover:cursor-pointer" v-for="photo in externalPhotoList" v-bind:key="photo"
                :href="backendBaseAPI + photo" target="_blank">
                <img :src="photo" class="box-border h-64 w-64 border-4 border-gray" />
            </a>
            <a class="hover:cursor-pointer" v-for="video in externalVideoList" v-bind:key="video"
                :href="backendBaseAPI + video" target="_blank">
                <video :src="video" class="box-border h-64 w-64" controls></video>
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
            showOption: this.message.sender === 'me' ? true : false,
            attachmentAPI: 'https://ticket-backend.iran.liara.run/api/tickets/messages/details/attachment/',
            backendBaseAPI: 'https://ticket-backend.iran.liara.run',
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
        await this.fetchMediaURL()
        // console.log('photo list', this.photoList)
        // console.log('video list', this.videoList)
        // console.log('file list', this.fileList)
        // console.log('audio list', this.audioList)

    },
    methods: {

        detectURLs(message) {
            if (message) {
                var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
                return message.match(urlRegex)
            }
        },
        async fetchMediaURL() {
            var urls = this.detectURLs(this.lastMessage)
            for (const url of urls) {
                this.externalPhotoList.push(url)
            }
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