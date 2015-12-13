FeedbackBar = React.createClass({

    propTypes: {
        scores: React.PropTypes.array.isRequired,
    },

    thisPlayersScore() {
        var playerScore = this.props.scores.find(x => x.player == Meteor.userId());
        var score = 0;
        if (playerScore) {
            score = playerScore.score;
        }
        return score;
    },

    lastRound() {
        var playerScore = this.props.scores.find(x => x.player == Meteor.userId());
        var lastRoundArr = ["", ""];

        if (playerScore) {
            if (playerScore.result == "right") {
                lastRoundArr[0] = "Right!";
                if (playerScore.opponent == "bot") {
                    lastRoundArr[1] = "You bested a dumb bot. +1";
                } else {
                    lastRoundArr[1] = "You fooled " + playerScore.opponent + ". +1";
                }
            } else {
                lastRoundArr[0] = "Wrong!";
                if (playerScore.opponent == "bot") {
                    lastRoundArr[1] = "A dumb bot fooled you. -2";
                } else {
                    lastRoundArr[1] = playerScore.opponent + " fooled you. -2";
                }
            }
        }
        return lastRoundArr;
    },

    render() {
        var score = this.thisPlayersScore();

        var lastRoundArr = this.lastRound();

        return (
            <div className="feedbackbar">
                <div className="scorebox">
                    <div className="subtitle">Score</div>
                    <div className="scoretext">{score}</div>
                </div>

                <Marquee scores={this.props.scores}/>

                <TimeBox/>
            </div>
        );
    }
});
