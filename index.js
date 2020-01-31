const
    configuration = require('./config.json'),
    io = require('socket.io-client'),
    socket = io('wss://socket.donationalerts.ru:443'),
    Discord = require('discord.js'),
    client = new Discord.Client(),
    id = require('uniqid'),
    mysql = require('mysql2/promise'),
    con = mysql.createPool(configuration.mysql);


socket.emit('add-user', { token: configuration.key, type: "minor" });
client.login(configuration.token)

socket.on('donation', async message => {
    const cheque = id('cheque-');
    message = JSON.parse(message);
    user = await client.fetchUser(message.username);

    if (!user) return;
    const [data] = await con.query(`SELECT * FROM users WHERE user_id = ?`, [user.id]);
    if (data[0]) {
        await con.query(`UPDATE users SET balance = balance + ? WHERE user_id = ?`, [message.amount_main, user.id])
    } else {
        await con.query(`INSERT INTO users (user_id, balance) VALUES (?,?)`, [user.id, message.amount_main]);
    }
    await con.query(`INSERT INTO donates (authorID, revieced, currency, transform, message, cheque) VALUES (?, ?, ?, ?, ?, ?)`, [message.username, +message.amount, message.currency, +message.amount_main, message.message, cheque])
    const embed = new Discord.RichEmbed()
        .setAuthor(`Получен новый донат от ${user.tag}!`, user.displayAvatarURL)
        .setDescription(`Получено **\`${message.amount}${message.currency} => ${message.amount_main}RUB\`**\nЧЕК АЙДИ: ${cheque}\n\n${message.message}`, true)
    let channel = client.channels.get(configuration.channel);
    if (channel) channel.send(embed).catch(e => {});
})

client.on('message', message => {

})