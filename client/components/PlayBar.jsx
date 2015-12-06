const {
    Colors,
    RaisedButton,
    TextField,
    Toolbar,
    ToolbarGroup,
    ToolbarSeparator,
    ToolbarTitle
} = mui;

const ThemeManager = new mui.Styles.ThemeManager();

PlayBar = React.createClass({
    mixins: [ReactMeteorData],

    getMeteorData() {
        Meteor.subscribe('game');
        Meteor.subscribe('channels');
        Meteor.subscribe('rooms');

        return {
            lobby: Channels.findOne({name: 'lobby'}),
            game: Game.findOne({}),
            channel: Channels.findOne({name: Session.get('channel')}),
            rooms: Rooms.find({}).fetch(),
            userId: Meteor.userId(),
            sessionChannel: Session.get('channel'),
        }
    },

    childContextTypes: {
        muiTheme: React.PropTypes.object
    },

    getChildContext: function() {
        return {
            muiTheme: ThemeManager.getCurrentTheme()
        };
    },

    handleSubmit(e) {

        e.preventDefault();

        var messageText = this.refs.textInput.getValue();
        this.refs.textInput.setValue("");
        var userId = this.data.userId;

        console.log('messageText', messageText);


        Meteor.call('findRoom', userId, function (error, room) {
            if (error) {
                console.log('handleSubmit, findRoom(): ', error);
            } else {
                Meteor.call(
                    'newMessage',
                    // Human
                    Meteor.users.findOne({_id: userId}),
                    {
                        text: messageText,
                        channel: room._id
                    }
                );

                if (room.player2 == "bot") {
                    Meteor.call('reply', messageText, function (error, result) {
                        if (error) {
                            console.log('keypress input, reply(): ', error);
                        } else {
                            Meteor.call(
                                'newMessage',
                                // Bot
                                Meteor.users.findOne({username: "player"}),
                                {
                                    text: result,
                                    channel: room._id
                                }
                            );
                        }
                    });
                };
            };
        });
    },

    clickBotButton() {
        console.log('****** Trying to click');
        var lobby = this.data.lobby;
        Session.set('channel', lobby.name);

        var playerId = this.data.userId;
        var room = Meteor.call('findRoom', playerId, function (error, room) {
            if (error) {
                console.log('click bot: ', error);
            }
            else {
                console.log('****** clicking', playerId, room._id);
                Meteor.call('scoreAndRematch', playerId, "bot", room);
            }
        });
    },

    clickHumanButton() {
        var lobby = this.data.lobby;
        Session.set('channel', lobby.name);

        var playerId = this.data.userId;
        var room = Meteor.call('findRoom', playerId, function (error, room) {
            if (error) {
                console.log('click human: ', error);
            }
            else {
                Meteor.call('scoreAndRematch', playerId, "human", room);
            }
        });
    },

    buttonsDisabled() {
        var game = this.data.game;
        if (game) {
            var state = game.state;
            if (state != "Started") {
                return true;
            }
        };

        if (this.data.sessionChannel == 'lobby') {
            return true;
        }

        var channel = this.data.channel;
        if (channel) {
            var channelName = channel.name;
            var room = this.data.rooms.find(x => x._id == channelName);
            if (room) {
                var minChatTime = Meteor.settings.public.minChatTime * 1000;
                if ((Date.now() - room.liveTime) < minChatTime) {
                    return true;
                }
            }
        }
    },

    render() {
        return (
            <div className="playbar">
                <form onSubmit={this.handleSubmit}>
                    <TextField
                        ref="textInput"
                        hintText="Message your opponent"
                        fullWidth={true}
                    />
                </form>

                <RaisedButton
                    disabled={this.buttonsDisabled()}
                    onClick={this.clickBotButton}
                    style={{float: "left",
                            margin: "10px",
                           }}
                    label="Bot"
                    primary={true}/>

                <RaisedButton
                    disabled={this.buttonsDisabled()}
                    onClick={this.clickHumanButton}
                    style={{float: "right",
                            margin: "10px",
                           }}
                    label="Human"
                    primary={true}/>
            </div>
        )
    }
});
