const { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const roblox = require("noblox.js");

module.exports = new ApplicationCommand({
    command: {
        name: 'citizenship',
        description: 'Complete the application to become an Irish Citizen.',
        type: 1,
        options: [
            {
                name: 'roblox_id',
                description: 'Your Roblox User ID or profile link.',
                type: 3,
                required: true,
            }
        ]
    },
    options: {
        cooldown: 5000
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const requiredRoleId = '1273226806971072573'; // Replace with the role ID you want to restrict the command to
        const allowedChannelId = '1273331988874661909'; // Replace with the channel ID you want to restrict the command to
        const logChannelId = '1273337243150323774'; // Channel ID where actions should be logged

        // Check if the command is used in the correct channel
        if (interaction.channelId !== allowedChannelId) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setDescription("This command may only be used in <#1273331988874661909>.")
                    .setColor('#FF0000')
                ],
                ephemeral: true
            });
        }

        // Check if the user has the required role
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.has(requiredRoleId)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setDescription("You are not in the Immigration Service.")
                    .setColor('#FF0000')
                ],
                ephemeral: true
            });
        }

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setDescription('Immigration Service will process your application shortly. Please wait...')
                .setColor('#FFFF00')
            ],
            ephemeral: true
        });

        const robloxInput = interaction.options.getString('roblox_id');
        const robloxId = robloxInput.match(/\d+/)[0];

        try {
            const robloxUser = await roblox.getUsernameFromId(robloxId);

            // Check if the user is in the group
            const groupId = 15725709; // Replace with your group ID
            const userRank = await roblox.getRankInGroup(groupId, robloxId);

            if (userRank === 0) { // User is NOT in the group
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setDescription(`The user [${robloxUser}](https://www.roblox.com/users/${robloxId}/profile) is not a member of the group. You must join the group before applying for citizenship.`)
                        .setColor('#FF0000')
                    ]
                });
            }

            // If the user is in the group, proceed with the application process
            const thumbnails = await roblox.getPlayerThumbnail(robloxId, 420, 'png', false, 'headshot');
            const thumbnailUrl = thumbnails[0]?.imageUrl || 'https://example.com/default-thumbnail.png';
            const userInfo = await roblox.getPlayerInfo(robloxId);

            const embed = new EmbedBuilder()
                .setDescription(`## [${robloxUser}](https://www.roblox.com/users/${robloxId}/profile)'s Application for Citizenship`)
                .addFields(
                    { name: '**Roblox Information**', value: '\u200B' }, // Section Title
                    { name: 'Roblox Username', value: userInfo.username ?? 'N/A', inline: true },
                    { name: 'Display Name', value: userInfo.displayName ?? 'N/A', inline: true },
                    { name: 'Roblox ID', value: robloxId?.toString() ?? 'N/A', inline: true },
                    { name: 'Account Age (days)', value: userInfo.age?.toString() ?? 'N/A', inline: true },
                    
                    // Separator
                    { name: '\u200B', value: '\u200B', inline: false },

                    // Discord Information
                    { name: '**Discord Information**', value: '\u200B' }, // Section Title
                    { name: 'Discord Username', value: interaction.user.username?.toString() ?? 'N/A', inline: true },
                    { name: 'Discord ID', value: interaction.user.id?.toString() ?? 'N/A', inline: true },
                    {
                        name: 'Joined Server (days)',
                        value: interaction.guild?.members.cache.get(interaction.user.id)?.joinedAt
                            ? `${Math.floor((Date.now() - interaction.guild.members.cache.get(interaction.user.id).joinedAt) / (1000 * 60 * 60 * 24))} days`
                            : 'N/A',
                        inline: true
                    }
                )
                .setColor('#00FF00')
                .setThumbnail(thumbnailUrl)
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('citizenship_approve')
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('citizenship_reject')
                        .setLabel('No')
                        .setStyle(ButtonStyle.Danger)
                );

            const channel = client.channels.cache.get('1273240366430027929');
            const message = await channel.send({ embeds: [embed], components: [row] });

            const filter = i => i.customId === 'citizenship_approve' || i.customId === 'citizenship_reject';
            const collector = message.createMessageComponentCollector({ filter });

            collector.on('collect', async i => {
                if (i.customId === 'citizenship_approve') {
                    await roblox.setRank({ group: groupId, target: robloxId, rank: 3 });
                    await i.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription('The user has been accepted as an Irish Citizen.')
                            .setColor('#00FF00')
                        ],
                        components: []
                    });

                    // Fetch the member and role, then add the role to the user
                    const member = await interaction.guild.members.fetch(interaction.user.id);
                    const roleId = '1273226732203278346';
                    const role = interaction.guild.roles.cache.get(roleId);
                    const roleId2 = '1273226806971072573';
                    const role2 = interaction.guild.roles.cache.get(roleId2);

                    if (!role) {
                        throw new Error(`Role with ID ${roleId} not found`);
                    }

                    await member.roles.add(role);
                    await member.roles.remove(role2);

                    await interaction.user.send({
                        embeds: [new EmbedBuilder()
                            .setDescription(`## Citizenship Application \n Dear ${robloxUser}, We are pleased to inform you that your Application for Irish Citizen has been accepted.`)
                            .setImage(`https://media.discordapp.net/attachments/967136540784484413/1273372309209743472/image.png?ex=66bf08a0&is=66bdb720&hm=cf06f7f0066faee60f08445801368f8c922cccce0bf030b34676b7a7f78a4396&=&format=webp&quality=lossless&width=1336&height=671`)
                            .setColor('#00FF00')
                            .setThumbnail(`https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Coat_of_arms_of_Ireland.svg/800px-Coat_of_arms_of_Ireland.svg.png`)
                        ]
                    });

                    // Log the approval action
                    const logChannel = client.channels.cache.get(logChannelId);
                    if (logChannel) {
                        await logChannel.send({
                            embeds: [new EmbedBuilder()
                                .setTitle('Citizenship Application Approved')
                                .setDescription(`**Action taken by:** ${i.user.tag}\n**User:** [${robloxUser}](https://www.roblox.com/users/${robloxId}/profile)\n**Action:** Approved`)
                                .setColor('#00FF00')
                                .setTimestamp()
                            ]
                        });
                    }

                } else if (i.customId === 'citizenship_reject') {
                    const modal = new ModalBuilder()
                        .setCustomId('rejection_reason_modal')
                        .setTitle('Rejection Reason');

                    const reasonInput = new TextInputBuilder()
                        .setCustomId('rejection_reason')
                        .setLabel("Please provide a reason for rejection:")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    const modalActionRow = new ActionRowBuilder().addComponents(reasonInput);
                    modal.addComponents(modalActionRow);

                    await i.showModal(modal);
                }
            });

            client.on('interactionCreate', async (interaction) => {
                if (!interaction.isModalSubmit()) return;

                if (interaction.customId === 'rejection_reason_modal') {
                    const reason = interaction.fields.getTextInputValue('rejection_reason');
                    const robloxUser = await roblox.getUsernameFromId(robloxId); // Ensure the Roblox username is up-to-date

                    await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`The user has been rejected as an Irish Citizen. Reason: ${reason}`)
                            .setColor('#FF0000')
                        ],
                        components: []
                    });

                    await interaction.user.send({
                        embeds: [new EmbedBuilder()
                            .setDescription(`## Citizenship Application \n Dear ${robloxUser}, Unfortunately, your Application for Irish Citizenship has been rejected, you may reapply in one weeks time. \n Reason for Denial: ${reason}.`)
                            .setImage(`https://media.discordapp.net/attachments/967136540784484413/1273372309209743472/image.png?ex=66bf08a0&is=66bdb720&hm=cf06f7f0066faee60f08445801368f8c922cccce0bf030b34676b7a7f78a4396&=&format=webp&quality=lossless&width=1336&height=671`)
                            .setColor('#FF0000')
                            .setThumbnail(`https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Coat_of_arms_of_Ireland.svg/800px-Coat_of_arms_of_Ireland.svg.png`)
                        ]
                    });

                    // Log the rejection action
                    const logChannel = client.channels.cache.get(logChannelId);
                    if (logChannel) {
                        await logChannel.send({
                            embeds: [new EmbedBuilder()
                                .setTitle('Citizenship Application Rejected')
                                .setDescription(`**Action taken by:** ${interaction.user.tag}\n**User:** [${robloxUser}](https://www.roblox.com/users/${robloxId}/profile)\n**Action:** Rejected\n**Reason:** ${reason}`)
                                .setColor('#FF0000')
                                .setTimestamp()
                            ]
                        });
                    }
                }
            });

            collector.on('end', collected => {
                if (!collected.size) {
                    message.edit({
                        embeds: [new EmbedBuilder()
                            .setDescription('No action was taken on this application.')
                            .setColor('#FFFF00')
                        ],
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setDescription('There was an error processing your request. Please ensure your Roblox ID is valid.')
                    .setColor('#FF0000')
                ],
                ephemeral: true
            });
        }
    }
}).toJSON();
