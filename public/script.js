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
	mobile: undefined,
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
	"Loops",
	"Arrays",
	"Libraries",
	"Functions",
	"OOP",
	"Greedy",
	"Recursion",
	"Sorting",
	"Binary Search",
	"Graphs",
	"BFS DFS",
	"Flood Fill",
	"Dynamic Programming",
	"Automation",
	"Google Maps",
	"Maze Generation",
	"Web Development",
];

$(".login").on("click", function (e) {
	e.preventDefault();
	if (firebase.auth().currentUser) {
		if ($(this).hasClass("navbar-font")) {
			if ($("#logout")[0]) {
				$("#logout").fadeOut(150,() => {
					$("#logout").remove();
				});
			} else {
				let w = $(".username").width();
				$(
					`<div id='logout' class='logoutMenu' style='width: ${w}px;'>Logout?<div>`
				)
					.hide()
					.appendTo($(".username").parent().parent().parent())
					.fadeIn(150, () => {
						$("#logout").on("click", () => {
							$("#logout").remove();
							logout();
							location.reload();
						});
					});
			}
		} else {
			console.log("bye");
			logout();
		}
	} else {
		login();
	}
});

firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		if (
			!(
				user.email.endsWith("@inst.hcpss.org") ||
				user.email.endsWith("@hcpss.org")
			)
		) {
			logout();
			$("body").prepend(
				`<div style="text-align: center; background: lightcoral; border-radius: 0px; padding: 15px; margin-bottom: 10px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 600; color: white">Please login with an HCPSS account!</p>
                                </div>`
			);
			window.scrollTo(0, 0);
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
				.then(() => {
					if (localStore.school && ($("#articles")[0] || $(".quiz"))) {
						location.reload();
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

	if ($(".quiz")[0]) {
		if (user) {
			const question = $(".quiz").attr("name").replaceAll("_", " ");
			const cat = $(".quiz").attr("cat");
			const questionNum = questionOrder.indexOf(question);
			if (questionNum !== -1) {
				if (localStore.school) {
					try {
						getQuestions(
							question,
							localStore.randomNumbers.slice(
								questionNum * 3,
								questionNum * 3 + 3
							),
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
		} else {
			$(".quiz").append(
				`<div id='noQuiz'><hr>
				<div class='article-content-sectiontitle color-black' style="margin: 1.5rem 0; display: flex; flex-direction: row; justify-content: center; align-items: center">
					<div>Login to unlock the quiz!</div>
					<div class= "hvr-darken color-white rounded-md btn-1" id="loginButton" style="transform: scale(.75)">Login</div>
				  </div></div>`
			);
			$("#loginButton").on("click", () => {
				login();
			});
		}
	}
});

if ($(".leaderboard-wrapper")[0]) {
	if (!localStore.leaderboard || time(60)) {
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

if ($(".hours")[0]) {
	rt.ref("users/count")
		.get()
		.then((snapshot) => {
			const data = snapshot.val();
			$(".users").text(data);
		});

	if (!localStore.leaderboard || time(60)) {
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
				$(".hours").text(
					Math.floor(sumLeaderboard(localStore.leaderboard) / 60)
				);
			});
	} else {
		$(".hours").text(Math.floor(sumLeaderboard(localStore.leaderboard) / 60));
	}
}

if ($("#articles")[0]) {
	if (localStore.questionsSolved) {
		for (let i = 0; i < localStore.questionsSolved.length; i++) {
			const question = localStore.questionsSolved[i].replaceAll(" ", "_");
			console.log("." + question);
			$("." + question)
				.removeClass("hcpss-black bg-hcpss-offwhite")
				.addClass("color-white bg-limegreen")
				.text("Completed");
		}
	}
}

if (!localStore.mobile) {
	$(document.body).append(`
		<div class='mobile-wrapper' id="mobile-wrapper">
				  <p class='mobile-text'>This website works best on a laptop/larger screens. Press ok if you understand and still wish to continue</p>
				  <div class="hvr-darken color-white rounded-lg btn-mobile mobile-button-text" id="mobile">Ok</div>
		  </div>`);
	$("#mobile").on("click", () => {
		localStore.mobile = true;
		localStorage.setItem("mobile", JSON.stringify(true));
		$("#mobile-wrapper").remove();
	});
}
