const { Webhook } = require('discord-webhook-node');
if (process.env.WEBHOOK_TOKEN) {
    token = process.env.WEBHOOK_TOKEN;
} else {
    require('./token.js');
}
const webhook = new Webhook(token);
token = null;

postDiscord = async function(text) {
    var time = new Date();
    var minute = '' + time.getUTCMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    if (typeof text == 'string') {
        while (text.includes('`')) {
            text = text.replace('`', '\'');
        }
        webhook.send('`[' + time.getUTCHours() + ':' + minute + '] ' + text + '`');
    }
};