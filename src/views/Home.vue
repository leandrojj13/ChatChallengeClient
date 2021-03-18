<template>
  <div class="home">
    <div class="messaging">
      <div class="inbox_msg">
        <div class="inbox_people">
          <div class="headind_srch">
            <div class="recent_heading">
              <h4>Chat Rooms</h4>
            </div>
          </div>
          <div class="inbox_chat">
            <div
              class="chat_list"
              v-for="(room, index) in chatRooms"
              :key="index"
              @click="currentRoom = room;"
              :class="currentRoom == room ? 'active_chat' : ''"
            >
              <div class="chat_people">
                <div class="chat_img">
                  <img :src="room.picture" alt="sunil" />
                </div>
                <div class="chat_ib">
                  <h5>{{room.name}}</h5>
                  <p>{{room.description}}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mesgs">
          <div class="msg_history" id="historyMessages">
            <template v-for="(msg, index) in messages">
              <div class="outgoing_msg" v-if="msg.userId == user.id" :key="index">
                <div class="sent_msg">
                  <p>{{msg.message}}</p>
                  <span class="time_date">{{msg.createdDate | moment("MMMM Do YYYY, h:mm:ss a") }}</span>
                </div>
              </div>
              <div class="incoming_msg" v-else :key="index">
                <template>
                  <span
                    v-if="messages[index-1] && messages[index-1].userId != msg.userId"
                    class="time_date"
                  >{{msg.userFullName}}</span>
                  <div class="incoming_msg_img">
                    <img
                      v-if="!messages[index-1] || (messages[index-1] && messages[index-1].userId != msg.userId) "
                      src="https://ptetutorials.com/images/user-profile.png"
                      alt="sunil"
                    />
                  </div>
                </template>

                <div class="received_msg">
                  <div class="received_withd_msg">
                    <p>{{msg.message}}</p>
                    <span class="time_date">{{msg.createdDate | moment("MMMM Do YYYY, h:mm:ss a") }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="type_msg">
            <div class="input_msg_write">
              <button style="right: 50px;" class="msg_send_btn" type="button" @click="setCommand">
                <i class="fa fa-desktop" aria-hidden="true"></i>
              </button>
              <input type="text" v-model="message" class="write_msg" placeholder="Type a message" v-on:keyup.enter="saveMessage" />
              <button class="msg_send_btn" type="button" @click="saveMessage">
                <i class="fa fa-paper-plane-o" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import Url from "../Config/urls";
import * as signalR from "@microsoft/signalr";

@Component
export default class Home extends Vue {
  message = "";

  messages = [];
  chatRooms = [];
  currentRoom = null;

  connection: signalR.HubConnection;

  created() {
    this.configSignalR();
    this.getChatRooms();
  }
  get token() {
    return this.$store.getters.token;
  }

  public configSignalR() {
    let self = this;
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(Url.MainApiURL + "ChatRoomHub")
      .configureLogging(signalR.LogLevel.Trace)
      .withAutomaticReconnect()
      .build();
    this.connection.on("MessageRecived", function(chatRoomId) {
      if (self.currentRoom.id == chatRoomId) {
        self.getCurrentChatRoomMessage();
      }
    });
    this.connection.on("UserJoined", function(msg) {
      console.log(msg);
    });
    this.connection.on("StockInfo", function(response) {
      debugger;
      if (self.currentRoom.id == response.chatRoomId) {
        var msg = {
          chatRoomId: self.currentRoom.id,
          userFullName: "Stock bot",
          message: response.message,
          createdDate: new Date()
        };
        self.messages.push(msg);
        self.$nextTick().then(r => {
          var historyMessages = document.getElementById("historyMessages");
          historyMessages.scrollTop = historyMessages.scrollHeight;
        });
      }
    });
    this.connection
      .start()
      .then(function() {})
      .catch(function(err) {
        return console.error(err.toString());
      });
  }

  joinUser(chatRoom) {
    this.connection.invoke("JoinUser", chatRoom.id).catch(function(err) {
      return console.error(err.toString());
    });
  }

  @Watch("currentRoom")
  onCurrentRoom(value) {
    this.getCurrentChatRoomMessage();
    this.joinUser(value);
  }

  getCurrentChatRoomMessage() {
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + this.token);

    fetch(Url.ApiURL + "/ChatRoomMessage/ChatRoom/" + this.currentRoom.id, {
      method: "GET",
      headers: headers,
      mode: "cors",
      cache: "default"
    })
      .then(resp => resp.json())
      .then(response => {
        this.messages = response;
        this.$nextTick().then(r => {
          var historyMessages = document.getElementById("historyMessages");
          historyMessages.scrollTop = historyMessages.scrollHeight;
        });
      })
      .catch(err => {});
  }

  getChatRooms() {
    var headers = new Headers();

    headers.append("Authorization", "Bearer " + this.token);

    fetch(Url.ApiURL + "/ChatRoom", {
      method: "GET",
      headers: headers,
      mode: "cors",
      cache: "default"
    })
      .then(resp => resp.json())
      .then(response => {
        this.chatRooms = response;
        this.currentRoom = response[0];
      })
      .catch(err => {});
  }

  saveMessage() {
    if (this.message) {
      this.message = this.message.trim();
      var model = {
        userId: this.user.id,
        message: this.message,
        chatRoomId: this.currentRoom.id
      };
      const requestConfig = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        },
        body: JSON.stringify(model)
      };
      if (this.message.substr(0, 7) == "/stock=") {
        this.messages.push(model);
        this.$nextTick().then(r => {
          var historyMessages = document.getElementById("historyMessages");
          historyMessages.scrollTop = historyMessages.scrollHeight;
        });

        model.message = model.message.substr(7);
        requestConfig.body = JSON.stringify(model);
        this.message = null;
        fetch(Url.ApiURL + "/ChatRoomMessage/StockInfo", requestConfig)
          .then(resp => resp.json())
          .then(response => {})
          .catch(err => {})
          .finally(() => {});
      } else {
        fetch(Url.ApiURL + "/ChatRoomMessage", requestConfig)
          .then(resp => resp.json())
          .then(response => {
            this.message = null;
            this.getCurrentChatRoomMessage();
            this.connection.invoke("SendMessage", this.currentRoom.id);
          })
          .catch(err => {});
      }
    }
  }

  setCommand() {
    this.message = "/stock=stock_code";
  }
  get user() {
    return this.$store.getters.user;
  }
}
</script>
<style scoped>
.container {
  max-width: 1170px;
  margin: auto;
  margin-top: 50px;
}
img {
  max-width: 100%;
}
.inbox_people {
  background: #f8f8f8 none repeat scroll 0 0;
  float: left;
  overflow: hidden;
  width: 40%;
  border-right: 1px solid #c4c4c4;
}
.inbox_msg {
  border: 1px solid #c4c4c4;
  clear: both;
  overflow: hidden;
}
.top_spac {
  margin: 20px 0 0;
}

.recent_heading {
  float: left;
  width: 40%;
}
.srch_bar {
  display: inline-block;
  text-align: right;
  width: 60%;
}
.headind_srch {
  padding: 10px 29px 10px 20px;
  overflow: hidden;
  border-bottom: 1px solid #c4c4c4;
}

.recent_heading h4 {
  color: #05728f;
  font-size: 21px;
  margin: auto;
}
.srch_bar input {
  border: 1px solid #cdcdcd;
  border-width: 0 0 1px 0;
  width: 80%;
  padding: 2px 0 4px 6px;
  background: none;
}
.srch_bar .input-group-addon button {
  background: rgba(0, 0, 0, 0) none repeat scroll 0 0;
  border: medium none;
  padding: 0;
  color: #707070;
  font-size: 18px;
}
.srch_bar .input-group-addon {
  margin: 0 0 0 -27px;
}

.chat_ib h5 {
  font-size: 15px;
  color: #464646;
  margin: 0 0 8px 0;
}
.chat_ib h5 span {
  font-size: 13px;
  float: right;
}
.chat_ib p {
  font-size: 14px;
  color: #989898;
  margin: auto;
}
.chat_img {
  float: left;
  width: 11%;
}
.chat_ib {
  float: left;
  padding: 0 0 0 15px;
  width: 88%;
}

.chat_people {
  overflow: hidden;
  clear: both;
}
.chat_list {
  border-bottom: 1px solid #c4c4c4;
  margin: 0;
  padding: 18px 16px 10px;
}
.inbox_chat {
  height: 550px;
  overflow-y: scroll;
}

.active_chat {
  background: #ebebeb;
}

.incoming_msg_img {
  display: inline-block;
  width: 6%;
}
.received_msg {
  display: inline-block;
  padding: 0 0 0 10px;
  vertical-align: top;
  width: 92%;
}
.received_withd_msg p {
  background: #ebebeb none repeat scroll 0 0;
  border-radius: 3px;
  color: #646464;
  font-size: 14px;
  margin: 0;
  padding: 5px 10px 5px 12px;
  width: 100%;
}
.time_date {
  color: #747474;
  display: block;
  font-size: 12px;
  margin: 8px 0 0;
}
.received_withd_msg {
  width: 57%;
}
.mesgs {
  float: left;
  padding: 30px 15px 0 25px;
  width: 60%;
}

.sent_msg p {
  background: #05728f none repeat scroll 0 0;
  border-radius: 3px;
  font-size: 14px;
  margin: 0;
  color: #fff;
  padding: 5px 10px 5px 12px;
  width: 100%;
}
.outgoing_msg {
  overflow: hidden;
  margin: 26px 0 26px;
}
.sent_msg {
  float: right;
  width: 46%;
}
.input_msg_write input {
  background: rgba(0, 0, 0, 0) none repeat scroll 0 0;
  border: medium none;
  color: #4c4c4c;
  font-size: 15px;
  min-height: 48px;
  width: 100%;
}

.type_msg {
  border-top: 1px solid #c4c4c4;
  position: relative;
}
.msg_send_btn {
  background: #05728f none repeat scroll 0 0;
  border: medium none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  font-size: 17px;
  height: 33px;
  position: absolute;
  right: 0;
  top: 11px;
  width: 33px;
}
.messaging {
  padding: 0 0 50px 0;
}
.msg_history {
  height: 516px;
  overflow-y: auto;
}
</style>
