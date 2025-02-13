const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType, StringSelectMenuBuilder } = require('discord.js');
const { token, channelId, categoryId, roleId, logChannelId, supportRoleId } = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

// الأمر لفتح التذكرة
client.on('messageCreate', async message => {
    if (message.content.startsWith('$start') && message.author.id === '914927213084811335') {
        const embed = new EmbedBuilder()
            .setTitle('الدعم الفني')
            .setDescription('اضغط لفتح تذكرة أو عرض القواعد')
            .setColor(0x808080)
            .setImage('https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&')
            .setFooter({ text: 'الدعم الفني' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('الدعم الفني')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:emoji_3:1297192873111982140>'),
                new ButtonBuilder()
                    .setCustomId('ticket_rules')
                    .setLabel('قواعد التذكرة')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:emoji_4:1297194551450144809>')
            );

        const ticketChannel = await client.channels.fetch(channelId);
        ticketChannel.send({ embeds: [embed], components: [row] });
    }
});

// متغير لتتبع التذكرة ومن استلمها
const tickets = new Map();

// التفاعلات
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() && !interaction.isSelectMenu()) return;

    const { customId } = interaction;
    const { guild, user } = interaction;

    if (customId === 'open_ticket') {
        const category = await guild.channels.fetch(categoryId);
        const supportRole = guild.roles.cache.get(roleId);

        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username}`,
            parent: category,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: supportRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                }
            ]
        });

        // سجل التذكرة
        tickets.set(ticketChannel.id, { owner: user.id, handler: null });

        const embed = new EmbedBuilder()
            .setTitle(`مرحبا ${user.username}`)
            .setDescription(`الرجاء كتابة المشكلة دون منشن.\nمنشن الإدارة: ${supportRole}`)
            .setColor(0x808080)
            .setImage('https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&');

        ticketChannel.send({ embeds: [embed] });

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_actions')
                    .setPlaceholder('اختر إجراءً')
                    .addOptions(
                        {
                            label: 'استلام التذكرة',
                            value: 'take_ticket'
                        },
                        {
                            label: 'ترك التذكرة',
                            value: 'leave_ticket'
                        },
                        {
                            label: 'حذف التذكرة',
                            value: 'delete_ticket'
                        },
                        {
                            label: 'استدعاء الدعم',
                            value: 'call_support'
                        },
                        {
                            label: 'إضافة/إزالة عضو',
                            value: 'manage_members'
                        },
                        {
                            label: 'تغيير اسم التذكرة',
                            value: 'rename_ticket'
                        },
                        {
                            label: 'Rest',
                            value: 'rest_ticket'
                        }
                    )
            );

        ticketChannel.send({ components: [selectMenu] });
        interaction.reply({ content: `تم فتح التذكرة <#${ticketChannel.id}>`, ephemeral: true });

        const logChannel = await client.channels.fetch(logChannelId);
        const logEmbed = new EmbedBuilder()
            .setTitle('فتح التذكرة')
            .setDescription(`الاداري: <@${user.id}>\nالعضو: ${user.tag}\nاسم القناة: ${ticketChannel.name}`)
            .setColor(0x808080)
            .setImage('https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&');

        await logChannel.send({ embeds: [logEmbed] });
        await logChannel.send({ content: 'https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&' });
    }

    if (customId === 'ticket_rules') {
        const rules = `**# قوانين التذكرة**\n1 - احترام الإداري الذي في التكت\n2 - عدم كثرة المنشن /وكان معك بوت صنع العراقي \n3 - عدم التلفظ بالكلام البذيء`;
        interaction.reply({ content: rules, ephemeral: true });
    }

    if (interaction.isSelectMenu() && interaction.customId === 'ticket_actions') {
        const supportRole = guild.roles.cache.get(roleId);
        const ticketChannel = interaction.channel;

        if (!ticketChannel || ticketChannel.type !== ChannelType.GuildText) return;

        const ticket = tickets.get(ticketChannel.id);

        switch (interaction.values[0]) {
            case 'take_ticket':
                // تحقق ما إذا كانت التذكرة مستلمة
                if (ticket.handler) {
                    const handler = await guild.members.fetch(ticket.handler);
                    return interaction.reply({
                        content: `التذكرة مستلمة بالفعل من قبل ${handler.user.tag}. لا يمكنك استلامها حتى يتركها.`,
                        ephemeral: true
                    });
                }

                // تحقق ما إذا كان المستخدم لديه صلاحيات
                if (!interaction.member.roles.cache.has(supportRole.id)) {
                    return interaction.reply({
                        content: 'ليس لديك صلاحية لاستلام التذكرة.',
                        ephemeral: true
                    });
                }

                // تعيين المستخدم كالمستلم
                ticket.handler = interaction.user.id;
                tickets.set(ticketChannel.id, ticket);

                await ticketChannel.permissionOverwrites.edit(interaction.user.id, { SendMessages: true });
                await ticketChannel.permissionOverwrites.edit(ticketChannel.guild.id, { SendMessages: false });
                await ticketChannel.permissionOverwrites.edit(supportRole.id, { SendMessages: false });

                await ticketChannel.send(`تم استلام التذكرة من قبل <@${interaction.user.id}>`);

                const logChannelTake = await client.channels.fetch(logChannelId);
                const takeEmbed = new EmbedBuilder()
                    .setTitle('استلام التذكرة')
                    .setDescription(`الاداري: <@${interaction.user.id}>\nاسم التذكرة: ${ticketChannel.name}`)
                    .setColor(0x808080)
                    .setImage('https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&');

                await logChannelTake.send({ embeds: [takeEmbed] });
                await logChannelTake.send({ content: 'https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&' });
                break;

            case 'leave_ticket':
                // تحقق ما إذا كان المستخدم هو المستلم الحالي
                if (ticket.handler !== interaction.user.id) {
                    return interaction.reply({ content: 'لا يمكنك ترك التذكرة، يجب أن تكون المستلم.', ephemeral: true });
                }

                // إزالة المستلم
                ticket.handler = null;
                tickets.set(ticketChannel.id, ticket);

                await ticketChannel.permissionOverwrites.edit(interaction.user.id, { SendMessages: false });
                await ticketChannel.permissionOverwrites.edit(ticketChannel.guild.id, { SendMessages: true });
                await ticketChannel.permissionOverwrites.edit(supportRole.id, { SendMessages: true });

                await ticketChannel.send(`تم ترك التذكرة من قبل <@${interaction.user.id}>`);

                const logChannelLeave = await client.channels.fetch(logChannelId);
                const leaveEmbed = new EmbedBuilder()
                    .setTitle('ترك التذكرة')
                    .setDescription(`الاداري: <@${interaction.user.id}>\nاسم التذكرة: ${ticketChannel.name}`)
                    .setColor(0x808080)
                    .setImage('https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&');

                await logChannelLeave.send({ embeds: [leaveEmbed] });
                await logChannelLeave.send({ content: 'https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&' });
                break;

            case 'delete_ticket':
                // تحقق ما إذا كان المستخدم لديه صلاحيات
                if (!interaction.member.roles.cache.has(supportRole.id)) {
                    return interaction.reply({ content: 'ليس لديك صلاحية لحذف التذكرة.', ephemeral: true });
                }

                await ticketChannel.send('سيتم حذف التذكرة في 5 ثوانٍ...');
                setTimeout(async () => {
                    await ticketChannel.delete();
                }, 5000);

                const logChannelDelete = await client.channels.fetch(logChannelId);
                const deleteEmbed = new EmbedBuilder()
                    .setTitle('حذف التذكرة')
                    .setDescription(`الاداري: <@${interaction.user.id}>\nاسم التذكرة: ${ticketChannel.name}`)
                    .setColor(0xFF0000)
                    .setImage('https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&');

                await logChannelDelete.send({ embeds: [deleteEmbed] });
                await logChannelDelete.send({ content: 'https://media.discordapp.net/attachments/1334571345031200830/1334820008991264858/369fcb2c3ab0d48a94a5951263129319.jpg?ex=679deb81&is=679c9a01&hm=028937b9d3475307ccb8f7302a7c3f68695d5b2bbdd817461c5db2c3b6cd2160&' });
                break;

               
            case 'call_support':
    const supportPing = `<@&${supportRoleId}>`; // تعديل لعرض منشن الدور
    await ticketChannel.send(`استدعاء الدعم: ${supportPing}`);

    const logChannelCall = await client.channels.fetch(logChannelId);
    const callEmbed = new EmbedBuilder()
        .setTitle('استدعاء الدعم')
        .setDescription(`الاداري: <@${interaction.user.id}>\nاسم التذكرة: ${ticketChannel.name}`)
        .setColor(0x808080);

    await logChannelCall.send({ embeds: [callEmbed] });
    break;

            case 'manage_members':
                // تحقق ما إذا كان المستخدم لديه صلاحيات
                if (!interaction.member.roles.cache.has(supportRole.id)) {
                    return interaction.reply({ content: 'ليس لديك صلاحية لإدارة أعضاء التذكرة.', ephemeral: true });
                }

                interaction.reply({ content: 'قم بذكر المستخدم الذي تريد إضافته أو إزالته من التذكرة.', ephemeral: true });

                const filter = m => m.author.id === interaction.user.id;
                const collected = await ticketChannel.awaitMessages({ filter, max: 1, time: 60000 });

                if (collected.size > 0) {
                    const mention = collected.first().mentions.members.first();
                    if (mention) {
                        const hasAccess = ticketChannel.permissionsFor(mention).has(PermissionsBitField.Flags.ViewChannel);
                        if (hasAccess) {
                            await ticketChannel.permissionOverwrites.edit(mention.id, { ViewChannel: false });
                            ticketChannel.send(`تم إزالة <@${mention.id}> من التذكرة.`);
                        } else {
                            await ticketChannel.permissionOverwrites.edit(mention.id, { ViewChannel: true });
                            ticketChannel.send(`تم إضافة <@${mention.id}> إلى التذكرة.`);
                        }
                    } else {
                        interaction.followUp({ content: 'لم يتم العثور على مستخدم بهذا المنشن.', ephemeral: true });
                    }
                } else {
                    interaction.followUp({ content: 'انتهى الوقت لإضافة أو إزالة عضو.', ephemeral: true });
                }
                break;

            case 'rename_ticket':
                // تحقق ما إذا كان المستخدم لديه صلاحيات
                if (!interaction.member.roles.cache.has(supportRole.id)) {
                    return interaction.reply({ content: 'ليس لديك صلاحية لتغيير اسم التذكرة.', ephemeral: true });
                }

                interaction.reply({ content: 'يرجى كتابة الاسم الجديد للتذكرة.', ephemeral: true });

                const collectedRename = await ticketChannel.awaitMessages({ filter, max: 1, time: 60000 });

                if (collectedRename.size > 0) {
                    const newName = collectedRename.first().content;
                    await ticketChannel.setName(newName);
                    ticketChannel.send(`تم تغيير اسم التذكرة إلى ${newName}.`);
                } else {
                    interaction.followUp({ content: 'انتهى الوقت لتغيير اسم التذكرة.', ephemeral: true });
                }
                break;

            default:
                break;
        }
    }
});

client.login(token);