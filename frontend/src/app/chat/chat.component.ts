import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

const API_URL = 'https://api.dialogflow.com/v1/query?v=20150910/';
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    Authorization: 'Bearer 81e8406495144438a1cb13bade5ac097'
  })
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  messages = [];
  loading = false;
  sessionId = Math.random().toString(36).slice(-5);


  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.addBotMessage('Hi Human 🤖. I am a Pokémon bot. How can I help you?');
    this.addBotMessage('hint-hint... type \'help\'');

    this.http.post<any>(
      API_URL,
      {
        lang: 'en',
        query: 'photo pikachu',
        sessionId: '12345',
        timezone: 'America/New_York'
      }, httpOptions
    ).subscribe(res => {
      console.log(res);
      this.loading = false;
    });

  }

  addBotMessage(text) {
    this.messages.push({
      type: 'text',
      text,
      sender: 'PokéBot',
      avatar: '/assets/pikachu.jpg',
      date: new Date()
    });
  }

  addBotImageMessage(text, filesarr) {
    this.messages.push({
      type: 'file',
      text: 'Here you go!',
      files: filesarr,
      sender: 'PokéBot',
      avatar: '/assets/pikachu.jpg',
      date: new Date()
    });
  }

  addUserMessage(text) {
    this.messages.push({
      text,
      sender: 'You',
      reply: true,
      date: new Date()
    });
  }

  sendMessage(event) {
    const text = event.message;
    this.addUserMessage(text);
    this.loading = true;

    if (text === 'help') {
      this.addBotMessage('Try asking me about your favourite Pokémon! Ask me about their photo, their moves, or their abilities!');
    } else {

      this.http.post<any>(
        API_URL,
        {
          lang: 'en',
          query: text,
          sessionId: '12345',
          timezone: 'America/New_York'
        }, httpOptions
      )

        .subscribe(res => {

          if (res.result.fulfillment.data && res.result.fulfillment.data.is_image === true) {
            const files = [];
            files.push({
              url: res.result.fulfillment.data.url,
              type: 'image/png',
            });
            this.addBotImageMessage(text, files);
          } else {
            if (res.result.fulfillment.speech) {
              this.addBotMessage(res.result.fulfillment.speech);
            } else {
              this.addBotMessage('Sorry, please wait a couple of seconds and try again 🥺🥺🥺');
            }
          }
          this.loading = false;
        });
    }
  }
}
