const firebaseConfig = {
	apiKey: "AIzaSyAri11mSmD9xLBSUuRpTnCeUoycZhVwg70",
	authDomain: "hour-of-code-hcpss.firebaseapp.com",
	projectId: "hour-of-code-hcpss",
	storageBucket: "hour-of-code-hcpss.appspot.com",
	messagingSenderId: "352773936606",
	appId: "1:352773936606:web:2f8f9fdb2eb0897b3e794f",
	measurementId: "G-190QSXDS0X",
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();
var rt = firebase.database();

let questionsSolved = JSON.parse(localStorage.getItem("questionsSolved"));
let score = JSON.parse(localStorage.getItem("score"));
let totalScore = JSON.parse(localStorage.getItem("totalScore"));
let school = localStorage.getItem("school");
let leaderboard = JSON.parse(localStorage.getItem("leaderboard"));
let leaderboardTime = Date.parse(
	JSON.parse(localStorage.getItem("leaderboardTime"))
);

let students = {
	"Atholton High School": 1460,
	////
	"Centennial High School": 999,
	"Glenelg High School": 1196,
	"Hammond High School": 1394,
	"Howard High School": 1910,
	"Long Reach High School": 999,
	"Marriotts Ridge High School": 1472,
	"Mt Hebron High School": 1695,
	////
	"Oakland Mills High School": 999,
	"Reservoir High School": 1624,
	"River Hill High School": 1378,
	////
	"Wilde Lake High School": 999,
};

function login() {
	const googleAuth = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(googleAuth);
}

function logout() {
	firebase
		.auth()
		.signOut()
		.then(function () {
			localStorage.clear();
			$(".username").text("Login");
		})
		.catch(function (error) {
			console.log(error);
		});
}

function store(schoolName, scoreList, questions) {
	let ts = scoreList.reduce((a, b) => a + b, 0);

	localStorage.setItem("school", schoolName);
	localStorage.setItem("score", JSON.stringify(scoreList));
	localStorage.setItem("questionsSolved", JSON.stringify(questions));
	localStorage.setItem("totalScore", JSON.stringify(ts));

	school = schoolName;
	score = scoreList;
	totalScore = ts;
	questionsSolved = questionsSolved;
}

function time(t) {
	let d = new Date();
	if (leaderboardTime) {
		if ((d - leaderboardTime) / 1000 < t) {
			return false;
		}
	}
	localStorage.setItem("leaderboardTime", JSON.stringify(d));
	leaderboardTime = d;
	return true;
}

function renderLeaderboard() {
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
}

function renderScore() {
	if ($(".score")[0]) {
		$(".score").text(totalScore + " pts / 60 max");
		$(".score-bar").css({ width: (totalScore / 60) * 100 + "%" });
		for (var i = 1; i < 4; i++) {
			$(".sect" + i).text(score[i - 1]);
		}
	}
}

$(".login").on("click", function (e) {
	e.preventDefault();
	if (firebase.auth().currentUser) {
		logout();
		location.reload();
	} else {
		login();
	}
});

firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		if (!user.email.endsWith("@inst.hcpss.org")) {
			logout();
			$("body")
				.prepend(
					`<div style="text-align: center; background: lightcoral; border-radius: 100vw; padding: 10px; margin-bottom: 10px">
                        <p style="margin: 0">Please Login With HCPSS Account!</p>
                        </div>`
				)
				.scrollTop(0);
			setTimeout(() => {
				location.reload();
			}, 5000);
		}
		$(".username").text(user.displayName);

		if (!questionsSolved || !score || !school) {
			let userRef = rt.ref("users/" + user.uid);
			userRef
				.get()
				.then((snapshot) => {
					if (snapshot.exists()) {
						let data = snapshot.val();
						store(data.school, data.score, data.questionsSolved);
					} else {
						let randomNumberGenerated = [];
						for (let i = 0; i < 25; i++) {
							randomNumberGenerated.push(Math.floor(Math.random() * 10));
						}
						userRef.set({
							score: [0, 0, 0],
							school: "River Hill High School",
							questionsSolved: [0],
							randomNumbers: randomNumberGenerated,
						});
						store("River Hill High School", [0, 0, 0], []);
					}
				})
				.then(() => {
					renderScore();
				})
				.catch((error) => {
					console.error(error);
				});

			// let userRef = db.collection("users").doc(user.uid);
			// userRef
			// 	.get()
			// 	.then((snapshot) => {
			// 		if (snapshot.exists) {
			// 			let data = snapshot.data();
			// 			store(data.school, data.score, data.questionsSolved);
			// 		} else {
			// 			let randomNumberGenerated = [];
			// 			for (let i = 0; i < 25; i++) {
			// 				randomNumberGenerated.push(Math.floor(Math.random() * 10));
			// 			}
			// 			userRef.set(
			// 				{
			// 					school: "River Hill High School",
			// 					score: 0,
			// 					questionsSolved: [],
			// 					randomNumbers: randomNumberGenerated,
			// 				},
			// 				{ merge: true }
			// 			);

			// 			store("River Hill High School", 0, []);
			// 		}
			// 	})
			// 	.then(() => {
			// 		$(".score").text(score + " pts / 60 max");
			// 		$(".score-bar").css({ width: score + "%" });
			// 	});
		} else {
			renderScore();
		}
	}
});

if ($(".leaderboard-wrapper")[0]) {
	if (!leaderboard || time(15)) {
		rt.ref("schools/")
			.get()
			.then((snapshot) => {
				let data = snapshot.val();
				var orderedLeaderboard = [];

				for (var school in data) {
					orderedLeaderboard.push([school, data[school]]);
				}

				orderedLeaderboard.sort(function (a, b) {
					return b[1] - a[1];
				});

				localStorage.setItem("leaderboard", JSON.stringify(orderedLeaderboard));
				leaderboard = orderedLeaderboard;

				var d = new Date();
				localStorage.setItem("leaderboardTime", JSON.stringify(d));
				leaderboardTime = d;
			})
			.then(() => {
				renderLeaderboard();
			});

		// db.collection("schools")
		// 	.doc("Schools")
		// 	.get()
		// 	.then((snapshot) => {
		// 		let data = snapshot.data();
		// 		var orderedLeaderboard = [];

		// 		for (var school in data) {
		// 			orderedLeaderboard.push([school, data[school]]);
		// 		}

		// 		orderedLeaderboard.sort(function (a, b) {
		// 			return b[1] - a[1];
		// 		});

		// 		localStorage.setItem("leaderboard", JSON.stringify(orderedLeaderboard));
		// 		leaderboard = orderedLeaderboard;

		// 		var d = new Date();
		// 		localStorage.setItem("leaderboardTime", JSON.stringify(d));
		// 		leaderboardTime = d;
		// 	})
		// 	.then(() => {
		// 		renderLeaderboard();
		// 	});
	} else {
		renderLeaderboard();
	}
}

$(".increaseScore").on("click", function (e) {
	e.preventDefault();
	let pts = 4;
	let user = firebase.auth().currentUser;

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
});
