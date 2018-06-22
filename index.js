const { Client, Util } = require('discord.js');
const Discord = require('discord.js');
const { TOKEN, PREFIX, GOOGLE_API_KEY } = require('./botconfig.js');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const bot = new Client({disableEveryone:true});

const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map();

bot.on('warn', console.warn);

bot.on('error', console.error);

function ActivityStreaming() {
	return new Promise(resolve => {
	  setTimeout(() => {
		bot.user.setActivity(`👻DürümcüUsta👻`, { type: 'STREAMING',url:'https://www.twitch.tv/durumofficial'});
		ActivityServers1();
	  }, 10000);
	});
}
function ActivityServers1() {
	return new Promise(resolve => {
	  setTimeout(() => {
		bot.user.setActivity(`${bot.guilds.size} tane sunucuyu`, { type: 'WATCHING'});
		ActivityServers2();
	  }, 5000);
	});
}
function ActivityServers2() {
	return new Promise(resolve => {
	  setTimeout(() => {
		bot.user.setActivity(`Birilerine (D>yardım) için`, { type: 'PLAYING'});
		ActivityStreaming();
	  }, 5000);
	});
}


bot.on("ready",function(){
  bot.user.setUsername('Dürüm+');
  console.clear();
  console.log("");
  console.log("|====================|");
  console.log("|       Dürüm        |");
  console.log("|   Baba is online!  |");
  console.log("|====================|");
  console.log("");
  ActivityStreaming();

});


bot.on('message', async msg => { // eslint-disable-line
	if (msg.author.bot) return undefined;
	if (!msg.content.startsWith(PREFIX)) return undefined;

	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(' ')[0];
	command = command.slice(PREFIX.length)
	if (command === 'oynat') {
		
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send(msg.author + ",🙄 Üzgünüm ama bir odaya girmen gerekiyor.");
		if(!args[1]) return msg.channel.send(msg.author + ",🙄 Üzgünüm ama bir şarkı adı girmelisin");
		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(`🔊 **${playlist.title}** Adli şarkı oynatma listesine eklendi.`);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 5);
					let index = 0;
					var songselectiondesc = `${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}`;
					var songselectionembed = new Discord.RichEmbed()
						.setTitle("Herhangi bir müzik seçiniz")
						.setColor("#fa983a")
						.setDescription(songselectiondesc);
					msg.channel.send(songselectionembed);
					// eslint-disable-next-line max-depth
					try {
						
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 6, {
							maxMatches: 1,
							time: 10000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send(msg.author + ",🙄 Herhangi bir seçim yapılmadığı için müzik seçimi iptal edildi.");
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('❗Üzgünüm bunun ile ilgili hiçbir sonuç bulamadım.');
				}
			}
			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === 'geç') {
		
		if (!msg.member.voiceChannel) return msg.channel.send(msg.author + ",🙄 Üzgünüm ama bir odaya girmen gerekiyor.");
		if (!serverQueue) return msg.channel.send(msg.author + ",🙄 Üzgünüm şu anda hiçbir müzik çalmadığı için geç komutunu kullanamazsın.");
		serverQueue.connection.dispatcher.end('Geçme komutu kullanıldı.');
		msg.channel.send(`⏭ Şarkıyı geçme komutu kullanıldı.`);
		return undefined;
	} else if (command === 'durdur') {
		
		if (!msg.member.voiceChannel) return msg.channel.send(msg.author + ",🙄 Üzgünüm ama bir odaya girmen gerekiyor.");
		if (!serverQueue) return msg.channel.send(msg.author + ",🙄 Üzgünüm şu anda hiçbir müzik çalmadığı için durdur komutunu kullanamazsın.");
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('Durdurma komutu kullanıldı.');
		msg.channel.send(`⏹ Şarkıyı durdurma komutu kullanıldı.`);
		return undefined;
	} else if (command === 'ses') {
		
		if (!msg.member.voiceChannel) return msg.channel.send(msg.author + ",🙄 Üzgünüm ama bir odaya girmen gerekiyor.");
		if (!serverQueue) return msg.channel.send(msg.author + ",🙄 Üzgünüm oynatma listesinde hiç bir müzik yok.");
		if (!args[1]) return msg.channel.send(msg.author + `, Şuanki ses değeri: **${serverQueue.volume}**`);
		if (args[1] < 11 && args[1] > -1) {
			serverQueue.volume = args[1];
			serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
			return msg.channel.send(msg.author + `, Seçtiğin ses değeri: **${args[1]}**`);
		}else{
			return msg.channel.send(msg.author + ", 🙄 Üzgünüm ama seçtiğin ses en az 0 ve en fazla 10 olmalıdır.");
		}

	} else if (command === 'oynatmalistesi') {
		
		let index = 0;
		if (!serverQueue) return msg.channel.send(msg.author + ",🙄 Üzgünüm oynatma listesinde hiç bir müzik yok.");
		var oynatmalistesiembed = new Discord.RichEmbed()
			.setColor("#fa983a")
			.addField(`OYNATMA LİSTESİ`,`${serverQueue.songs.map(song => `**${++index}** 👉🏼 ${song.title}`).join('\n')}\n\n**Şu anda oynatılıyor:** ${serverQueue.songs[0].title}`);
		return msg.channel.send(oynatmalistesiembed);

		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('▶ Resumed the music for you!');
		}
		return msg.channel.send(msg.author + ",🙄 Üzgünüm oynatma listesinde hiç bir müzik yok.");
	} else if (command === 'yak') {
		if(!args[1]) return msg.channel.send(msg.author + ",🙄 Üzgünüm ama bir sayı girmelisin.");
		if(args[1] < 101 && args[1] > 0) {
			msg.channel.bulkDelete(args[1]);
			msg.channel.send(`🔥 ${args[1]} tane konuşma kül olup yandı.`).then(msg => msg.delete(2000));
		}else {
			return msg.channel.send(msg.author + ",🛑Üzgünüm ama gireceğin sayı 0 dan büyük 101 den ise küçük olmalı.");
		}
		return;
	} else if (command === 'yardım') {
		var yardimdescription = "\n\n❗ Bu komutları kullanırken başına (**D>**) koyarak yazınız.\n\n**Davet**\n - davet ,(Bu komut ile beni yanına çağırabilirsin.) [✅]\n\n**Müzik**\n - oynatmalistesi ,(Oynatma listesini gösterir.) [✅]\n - durdur ,(Çalan parçayı durdurmanıza yarar.) [✅\n - oynat ,(İstediğiniz parçayı oynatmanıza yarar.) [✅]\n - geç ,(Oynatma listesindeki diğer parçaya geçer.) [✅]\n - ses ,(Çalan parçanın sesini değiştirmeye yarar.) [✅]\n\n🔘 DİĞER KOMUTLAR YAKINDA...";

        var yardimembed = new Discord.RichEmbed()
          .setTitle("YARDIM MI LAZIM ?")
          .setColor("#fa983a")
          .setDescription(yardimdescription);
        msg.channel.send(yardimembed);
		return;
	} else if (command === 'davet') {
        var davetdescription = "\n💓 Hey! Genco bak şimdi eğer bu sana verdiğim linke tıklayıp beni kendi sunucuna alırsan Dürüm ailesini çok fazla desteklemiş olursun 💓\n\n🤜 https://bit.ly/2lm51E5";
        var davetdaembed = new Discord.RichEmbed()
          .setTitle("DAVET LİNKİ")
          .setColor("#fa983a")
          .setDescription(davetdescription);
        msg.author.send(davetdaembed);
		return;
	}

	return msg.channel.send(msg.author + ", 🙄 Üzgünüm ama böyle bir komut olduğuna eminmisin ?");
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			messageauthor: msg.author,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`❗Üzgünüm ama bir sorun oluştu Hata: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`❗Üzgünüm ama bir sorun oluştu Hata: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(`**${song.title}** Adlı şarkı oynatma listesine eklendi.`);
	}
	return undefined;
}

function play(guild, song,message) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	var oynatembed = new Discord.RichEmbed()
	.setColor("#fa983a")
	.addField(`BOTUN DURUMU`, `Dürüm botu ` + serverQueue.voiceChannel + ` odasına katıldı!`)
  .addField(`ŞARKIYI İSTEYEN KİŞİ`,serverQueue.messageauthor)
  .addField(`ŞU ANDA ÇALAN PARÇA`,`**${song.title}**`);
	serverQueue.textChannel.send(oynatembed);
}

bot.login(TOKEN);
