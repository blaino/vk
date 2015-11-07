Meteor.methods({
    cleanUp: function () {
        Messages.remove({});
        Channels.remove({});
        Meteor.users.remove({});
        Rooms.remove({});
        Scores.remove({});
        Waiting.remove({});
    },

    addStartingPlayers: function (numPlayers) {
        var player;
        for (i = 1; i <= numPlayers; i++) {
            if (!Meteor.users.findOne({username: "seedUser" + i})) {
                Accounts.createUser({
                    username: "seedUser" + String(i),
                    email: "seedUser" + String(i) + "@example.com",
                    password: "password"
                });
                player = Meteor.users.findOne({username: "seedUser" + String(i)});
                Meteor.call('addPlayer', player._id);
            };
        };
    },

    matchPlayersOld: function (percentBot) {
        var waiting = Waiting.find({}).fetch().length;
        while (waiting > 0) {
            Meteor.call('match', percentBot);
            waiting = Waiting.find({}).fetch().length;
        };
    },

    matchPlayers: function (percentBot, threshold, pauseTime) {
        var waiting = Waiting.find({}).fetch().length;
        while (waiting >= threshold) {
            Meteor.call('match', percentBot);
            waiting = Waiting.find({}).fetch().length;
        };
        waiting = Waiting.find({}).fetch().length;
        console.log('waiting', waiting);
        if (waiting > 0) {
            Meteor._sleepForMs(pauseTime);
            while (waiting > 0) {
                console.log('calling match after delay with ', Waiting.find({}).fetch());
                Meteor.call('match', percentBot);
                waiting = Waiting.find({}).fetch().length;
            };
        };
    },

    postMessages: function () {
        users = Meteor.users.find({});
        users.forEach(function (user) {
            Meteor.call('findRoom', user._id, function (error, room) {
                if (room) {
                    Factory.define('message', Messages, {
                        text: "A first message for " + user.username,
                        user: user._id,
                        timestamp: Date.now(),
                        channel: room._id
                    });
                    Factory.create('message');
                };
            });
        });
    },

    countLogins: function () {
        var users = Meteor.users.find({'services.resume': {$exists: true}});
        return users.count();
    },

    checkReady: function () {
        var numPlayers = Game.findOne({}).numPlayers;
        var loginCount = Meteor.call('countLogins');
        return (loginCount == numPlayers);
    },

    // Called on startup
    newGame: function () {
        Game.remove({});
        // setup config file? or config page?
        Game.insert({state: "Waiting", readyTime: 10, gameTime: 100, numPlayers: 2, numReady: 0});
    },

    readyGame: function () {
        Game.update({}, {$set: {state: "Readying"}});
        var timerId;

        function decReadyTime () {
            Game.update({}, {$inc: {readyTime: -1}});
            var game = Game.findOne({});
            if (game.readyTime <= 0) {
                Meteor.clearInterval(timerId);
                Meteor.call('startGame');
            }
        };

        timerId = Meteor.setInterval(decReadyTime, 1000);
    },

    startGame: function () {
        Game.update({}, {$set: {state: "Started"}});
        var timerId;

        Meteor.call('matchPlayers', 50);

        function decGameTime () {
            Game.update({}, {$inc: {gameTime: -1}});
            var game = Game.findOne({});
            if (game.gameTime <= 0) {
                Meteor.clearInterval(timerId);
                Meteor.call('endGame');
            }
        };

        timerId = Meteor.setInterval(decGameTime, 1000);
    },

    endGame: function () {
        Game.update({}, {$set: {state: "Ended"}}); // Maybe add winner: username?
        // Determine winner, sort and display results or something
        Rooms.remove({});
        Scores.remove({});
        Waiting.remove({});
    }
});
