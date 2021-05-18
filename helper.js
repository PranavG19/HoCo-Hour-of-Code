let login = () => {
	const googleAuth = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(googleAuth);
};

let logout = () => {
	firebase
		.auth()
		.signOut()
		.then(() => {
			localStorage.clear();
			$(".username").text("Login");
		})
		.catch(function (error) {
			console.log(error);
		});
};

let store = function (schoolName, scoreList, questions, randomNumbers) {
	let ts = scoreList.reduce((a, b) => a + b, 0);

	localStorage.setItem("school", schoolName);
	localStorage.setItem("score", JSON.stringify(scoreList));
	localStorage.setItem("questionsSolved", JSON.stringify(questions));
	localStorage.setItem("randomNumbers", JSON.stringify(randomNumbers));
	localStorage.setItem("totalScore", JSON.stringify(ts));

	school = schoolName;
	score = scoreList;
	totalScore = ts;
	questionsSolved = questionsSolved;
};

let time = function (t) {
	let d = new Date();
	if (leaderboardTime) {
		if ((d - leaderboardTime) / 1000 < t) {
			return false;
		}
	}
	localStorage.setItem("leaderboardTime", JSON.stringify(d));
	leaderboardTime = d;
	return true;
};

let renderLeaderboard = () => {
	for (var s in leaderboard) {
		$(`
        <div class="h-16">
            <div class="leaderboard-name text-right">
                ${leaderboard[s][0]}
            </div>
            <div class="leaderboard-points text-right">
                ${Math.floor(
									10000 * (leaderboard[s][1] / students[leaderboard[s][0]])
								)}
            </div>
        </div>`)
			.hide()
			.appendTo(".leaderboard-wrapper")
			.fadeIn(s * 150);
	}

	let maxScore = leaderboard[0][1];

	for (var s in leaderboard) {
		let bg;
		if (s == 0) {
			bg = "bg-gold";
		} else if (s == 1) {
			bg = "bg-silver";
		} else if (s == 2) {
			bg = "bg-bronze";
		} else {
			bg = "bg-blue2";
		}

		let w = (leaderboard[s][1] / maxScore) * 100;

		let bar = $(`
        <div class="h-16">
            <div class="${bg} height-1 lm-4 rounded-md"></div>
        </div>
        `);
		$(".leaderboard-bar").append(bar);
		bar.animate({ width: w + "%" }, 1000);
		// .$(".leaderboard-bar").append(`
		// <div class="h-16">
		//     <div class="${bg} height-1 lm-4 rounded-md" style="width: ${
		// 	(leaderboard[s][1] / maxScore) * 100
		// }%"></div>
		// </div>
		// `);
	}
};

let renderScore = () => {
	if ($(".score")[0]) {
		$(".score").text(totalScore + " pts / 60 max");
		$(".score-bar").css({ width: (totalScore / 60) * 100 + "%" });
		for (var i = 1; i < 4; i++) {
			$(".sect" + i).text(score[i - 1]);
		}
	}
};

let renderQuestions = () => {};

let increaseScore = (pts) => {
	let user = firebase.auth().currentUser;

	if (user == undefined) return;

	rt.ref("users/" + user.uid + "/score/1").set(
		firebase.database.ServerValue.increment(pts)
	);
	rt.ref("schools/" + school).set(firebase.database.ServerValue.increment(pts));

	rt.ref("users/" + user.uid)
		.get()
		.then((snapshot) => {
			let data = snapshot.val();
			store(data.school, data.score, data.questionsSolved);
			renderScore();
		});

	// db.collection("users").doc(user.uid).update({ score: increaseBy });
	// db.collection("schools").doc("Schools").update(schoolUpdate);

	// db.collection("users")
	// 	.doc(user.uid)
	// 	.get()
	// 	.then((snapshot) => {
	// 		let data = snapshot.data();
	// 		store(data.school, data.score, data.questionsSolved);
	// 		$(".score").text(score + " pts / 60 max");
	// 		$(".score-bar").css({ width: score + "%" });
	// 	});
};

let getQuestions = (questionName, numbers) => {
	rt.ref("questions/" + questionName + "/questions/" + numbers[0] + "/info")
		.get()
		.then((snapshot) => {
			let data = snapshot.val();
			localStorage.setItem(questionName, info);
		});
};
