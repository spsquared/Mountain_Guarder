const { Webhook } = require('discord-webhook-node');
const webhook = new Webhook(url);

postDiscord = async function(text) {
    var time = new Date();
    var minute = '' + time.getMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    webhook.send('`[' + time.getHours() + ':' + minute + '] ' + text + '`');
};