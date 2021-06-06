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

let localStore = {
	questionsSolved: undefined,
	score: undefined,
	totalScore: undefined,
	school: undefined,
	leaderboard: undefined,
	leaderboardTime: undefined,
	randomNumbers: undefined,
};

for (item in localStore) {
	i = localStorage.getItem(item);
	if (i !== undefined) {
		localStore[item] = JSON.parse(i);
	}
}

try {
	localStore["leaderboardTime"] = Date.parse(
		JSON.parse(localStorage.getItem("leaderboardTime"))
	);
} catch {
	localStore["leaderboardTime"] = undefined;
}

const students = {
	"Atholton High School": 1472,
	"Centennial High School": 1467,
	"Glenelg High School": 1263,
	"Hammond High School": 1316,
	"Howard High School": 1828,
	"Long Reach High School": 1595,
	"Marriotts Ridge High School": 1597,
	"Mt Hebron High School": 1635,
	"Oakland Mills High School": 1269,
	"Reservoir High School": 1788,
	"River Hill High School": 1470,
	"Wilde Lake High School": 1379,
};

const questionOrder = [
	"Hello World",
	"Variables 1",
	"Variables 2",
	"Booleans",
	"Arrays",
	"Loops",
	"Libraries",
	"Functions",
	"OOP",
	"Greedy",
	"Recursion",
	"Merge Sort",
	"Binary Search",
	"Graphs",
	"BFS & DFS",
	"Flood Fill",
	"Sorting",
	"Dynamic Programming",
	"Automation",
	"Google Maps",
	"Maze Generation",
	"Game Development",
	"Desktop Apps",
	"Mobile Apps",
	"Web Development",
];

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

		if (
			!localStore.questionsSolved ||
			!localStore.score ||
			!localStore.school
		) {
			const userRef = rt.ref("users/" + user.uid);
			userRef
				.get()
				.then((snapshot) => {
					if (
						snapshot.exists() &&
						snapshot.val().school !== (undefined || null || "")
					) {
						const data = snapshot.val();
						store(
							data.school,
							data.score,
							data.questionsSolved,
							data.randomNumbers
						);
						renderScore();
						$(".username").text(user.displayName);
						$(".login-button")
							.text("Logout")
							.css({ background: "lightcoral", color: "white" });
					} else {
						renderModal(user);
						renderScore();
						$(".username").text(user.displayName);
						$(".login-button")
							.text("Logout")
							.css({ background: "lightcoral", color: "white" });
					}
				})
				.catch((error) => {
					console.error(error);
				});
		} else {
			renderScore();
			$(".username").text(user.displayName);
			$(".login-button")
				.text("Logout")
				.css({ background: "lightcoral", color: "white" });
		}
	}
});

if ($(".leaderboard-wrapper")[0]) {
	if (!localStore.leaderboard || time(15)) {
		rt.ref("schools/")
			.get()
			.then((snapshot) => {
				const data = snapshot.val();
				var orderedLeaderboard = [];

				for (let school in data) {
					orderedLeaderboard.push([school, data[school]]);
				}

				orderedLeaderboard.sort(function (a, b) {
					return b[1] - a[1];
				});

				localStorage.setItem("leaderboard", JSON.stringify(orderedLeaderboard));
				localStore.leaderboard = orderedLeaderboard;

				const d = new Date();
				localStorage.setItem("leaderboardTime", JSON.stringify(d));
				localStore.leaderboardTime = d;
			})
			.then(() => {
				renderLeaderboard();
			});
	} else {
		renderLeaderboard();
	}
}

if ($(".quiz")[0]) {
	const question = $(".quiz").attr("name").replaceAll("_", " ");
	const cat = $(".quiz").attr("cat");
	const questionNum = questionOrder.indexOf(question);
	if (questionNum !== -1) {
		if (localStore.school) {
			try {
				getQuestions(
					question,
					localStore.randomNumbers.slice(questionNum * 3, questionNum * 3 + 3),
					cat,
					localStore.school
				);
			} catch {
				setTimeout(() => {
					localStore.randomNumbers = JSON.parse(
						localStorage.getItem("randomNumbers")
					);
					getQuestions(
						question,
						localStore.randomNumbers.slice(
							questionNum * 3,
							questionNum * 3 + 3
						),
						cat,
						localStore.school
					);
				}, 1000);
			}
		}
	}
}
