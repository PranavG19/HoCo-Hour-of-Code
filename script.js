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

let questionsSolved;
try {
	questionsSolved = JSON.parse(localStorage.getItem("questionsSolved"));
} catch {
	questionsSolved = [];
}
let score = JSON.parse(localStorage.getItem("score"));
let totalScore = JSON.parse(localStorage.getItem("totalScore"));
let school = localStorage.getItem("school");
let leaderboard = JSON.parse(localStorage.getItem("leaderboard"));
let leaderboardTime = Date.parse(
	JSON.parse(localStorage.getItem("leaderboardTime"))
);
let randomNumbers = JSON.parse(localStorage.getItem("randomNumbers"));

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
					`<div style="text-align: center; background: lightcoral; border-radius: 50px; padding: 15px; margin-bottom: 10px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 600; color: white">Please Login With HCPSS Account!</p>
                                </div>`
				)
				.scrollTop(0);
			setTimeout(() => {
				location.reload();
			}, 6000);
		}
		$(".username").text(user.displayName);
		$(".login-button")
			.text("Logout")
			.css({ background: "lightcoral", color: "white" });

		if (!questionsSolved || !score || !school) {
			let userRef = rt.ref("users/" + user.uid);
			userRef
				.get()
				.then((snapshot) => {
					if (snapshot.exists()) {
						let data = snapshot.val();
						store(
							data.school,
							data.score,
							data.questionsSolved,
							data.randomNumbers
						);
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
	increaseScore(4);
});

if ($(".quiz")[0]) {
	getQuestions("Automation", [1, 2, 3]);
}
