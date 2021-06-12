const login = () => {
	const googleAuth = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(googleAuth);
};

const logout = () => {
	console.log("hi");
	firebase
		.auth()
		.signOut()
		.then(() => {
			localStorage.clear();
			$(".username").text("Login");
			$(".login-button")
				.text("Login")
				.css({ background: "#dbeafd", color: "#3594D2" });
		})
		.catch(function (error) {
			console.log(error);
		});
};

const store = function (schoolName, scoreList, questions, randomNumbers) {
	const ts = scoreList.reduce((a, b) => a + b, 0);

	localStorage.setItem("school", JSON.stringify(schoolName));
	localStorage.setItem("score", JSON.stringify(scoreList));
	localStorage.setItem("questionsSolved", JSON.stringify(questions));
	localStorage.setItem("randomNumbers", JSON.stringify(randomNumbers));
	localStorage.setItem("totalScore", JSON.stringify(ts));

	localStore.school = schoolName;
	localStore.score = scoreList;
	localStore.totalScore = ts;
	localStore.questionsSolved = questions;
};

const renderModal = (user) => {
	const modal = `	
	<div class='modal-wrapper' style='display: flex;
	justify-content: center;
	align-items: center;
	position: absolute;
	left: 0;
	top: 0;
	width: 100vw;
	height: 100vh;
	z-index: 10;
	background-color: rgba(0, 0, 0, 0.3);'>
    <div class='modal' style='
	width: 450px;
	border-radius: 0.375rem;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	background-color: white;
	padding: 1.5rem 1.5rem 1.5rem 1.5rem;'>
      <div class='modal-title'>
      <h3 style='margin: 0;'>Which high school do you attend?</h3>
	  <div style="margin: 0; color: grey; font-size: 0.75rem">Note: Selecting the wrong school will make you ineligible for prizes</div>
    </div>
      <select id='modalSelect' style='margin-top: 20px;'>
        <option value=""></option>
        <option value="Atholton High School">Atholton High School</option>
        <option value="Centennial High School">Centennial High School</option>
        <option value="Glenelg High School">Glenelg High School</option>
        <option value="Hammond High School">Hammond High School</option>
        <option value="Howard High School">Howard High School</option>
        <option value="Long Reach High School">Long Reach High School</option>
        <option value="Marriotts Ridge High School">Marriotts Ridge High School</option>
        <option value="Mt Hebron High School">Mt Hebron High School</option>
        <option value="Oakland Mills High School">Oakland Mills High School</option>
        <option value="Reservoir High School">Reservoir High School</option>
        <option value="River Hill High School">River Hill High School</option>
        <option value="Wilde Lake High School">Wilde Lake High School</option>
      </select>
      <div class= "hvr-darken color-white rounded-md btn-1" style='margin: 20px 0 0 0' id="modalSubmit">Submit</div>
    </div>
  </div>
	`;
	$(modal).hide().prependTo($("body")).fadeIn(1000);

	$("#modalSubmit").on("click", () => {
		if ($("#modalSelect").val() !== (undefined || null || "")) {
			if (
				confirm(
					"Are you sure this is the correct school? You will NOT be able to change this later"
				)
			) {
				school = $("#modalSelect").val().trim();
				let createUser = firebase.functions().httpsCallable("createUser");

				createUser({
					uid: user.uid,
					school: school,
				})
					.then((result) => {
						store(school, [0, 0, 0], ["placeholder"], result.data);
						renderScore();
						$(".modal-wrapper").fadeOut(1000).remove();
					})
					.catch((error) => {
						console.error(error);
					});
				$(".username").text(user.displayName);
				$(".login-button")
					.text("Logout")
					.css({ background: "lightcoral", color: "white" });
			}
		}
	});
};

const time = function (t) {
	const d = new Date();
	if (localStore.leaderboardTime) {
		if ((d - localStore.leaderboardTime) / 1000 < t) {
			return false;
		}
	}
	localStorage.setItem("leaderboardTime", JSON.stringify(d));
	localStore.leaderboardTime = d;
	return true;
};

function sumLeaderboard(lb) {
	sum = 0;
	for (let i = 0; i < lb.length; i++) {
		sum += lb[i][1];
	}
	return sum;
}

function sortFunction(a, b) {
	if (a[1] === b[1]) {
		return 0;
	} else {
		return a[1] > b[1] ? -1 : 1;
	}
}

const renderLeaderboard = () => {
	let lb = [];
	for (var s in localStore.leaderboard) {
		lb.push([
			localStore.leaderboard[s][0],
			Math.floor(
				10000 *
					(localStore.leaderboard[s][1] /
						(students[localStore.leaderboard[s][0]] * 60))
			),
		]);
	}
	lb.sort(sortFunction);

	for (var s in localStore.leaderboard) {
		$(`
        <div class="h-16">
            <div class="leaderboard-name text-right">
                ${lb[s][0]}
            </div>
            <div class="leaderboard-points text-right">
                ${lb[s][1]}
            </div>
        </div>`)
			.hide()
			.appendTo(".leaderboard-wrapper")
			.fadeIn(s * 150);
	}

	const maxScore = lb[0][1];

	for (var s in localStore.leaderboard) {
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

		const w = (lb[s][1] / maxScore) * 100;

		const bar = $(`
        <div class="h-16">
            <div class="${bg} height-1 lm-4 rounded-md"></div>
        </div>
        `);
		$(".leaderboard-bar").append(bar);
		bar.animate({ width: w + "%" }, 1000);
	}
};

const renderScore = () => {
	if ($(".score")[0]) {
		ts = localStore.totalScore || 0;
		s = localStore.score || [0, 0, 0];
		$(".score").text(Math.min(60, ts) + " pts / 60 max");
		$(".score-bar").css({ width: Math.min(100, (ts / 60) * 100) + "%" });
		for (let i = 1; i < 4; i++) {
			$(".sect" + i).text(s[i - 1]);
		}
	}
};

const renderQuestions = (questions, questionName) => {
	$("#noQuiz").remove();
	const completed = localStore.questionsSolved.indexOf(questionName) !== -1;
	if (completed) {
		$(".quiz").append(
			`<hr><div class='article-content-sectiontitle color-black' style="margin: 1.5rem 0;">Quiz - <strong class="color-white bg-limegreen rounded-md padding-1">Completed</strong></div>`
		);
	} else {
		$(".quiz").append(
			`<hr><div class='article-content-sectiontitle color-black' style="margin: 1.5rem 0;">Quiz</div>`
		);
	}
	for (let i = 0; i < questions.length; i++) {
		if (questions[i][0] == "mc" || questions[i][0] == "mcq") {
			$(".quiz").append(`
            <fieldset id='group-${i}' style="margin-bottom: 15px; border: none;">
                <div class='article-subtitle color-black mt-4 mb-4'> ${questions[i][1]} </div>
                <input type="radio" id="${i}.1" name="group-${i}" value="${i}.1" style="margin: 15px 0 10px 30px">
                <label for="${i}.1" class="article-content color-black"> ${questions[i][2]} </label><br>
                <input type="radio" id="${i}.2" name="group-${i}" value="${i}.2" style="margin: 0 0 10px 30px">
                <label for="${i}.2" class="article-content color-black"> ${questions[i][3]} </label><br>
                <input type="radio" id="${i}.3" name="group-${i}" value="${i}.3" style="margin: 0 0 10px 30px">
                <label for="${i}.3" class="article-content color-black"> ${questions[i][4]} </label><br>
                <input type="radio" id="${i}.4" name="group-${i}" value="${i}.4" style="margin: 0 0 10px 30px">
                <label for="${i}.4" class="article-content color-black"> ${questions[i][5]} </label>
            </fieldset>`);
		} else if (questions[i][0] == "smc") {
			$(".quiz").append(`
            <fieldset id='group-${i}' style="margin-bottom: 15px; border: none;">
                <div class='article-subtitle color-black mt-4 mb-4'> ${questions[i][1]} </div>
                <input type="radio" id="${i}.1" name="group-${i}" value="${i}.1" style="margin: 15px 0 10px 30px">
                <label for="${i}.1" class="article-content color-black"> ${questions[i][2]} </label><br>
                <input type="radio" id="${i}.2" name="group-${i}" value="${i}.2" style="margin: 0 0 10px 30px">
                <label for="${i}.2" class="article-content color-black"> ${questions[i][3]} </label><br>
                <input type="radio" id="${i}.3" name="group-${i}" value="${i}.3" style="margin: 0 0 10px 30px">
                <label for="${i}.3" class="article-content color-black"> ${questions[i][4]} </label><br>
            </fieldset>`);
		} else if (questions[i][0] == "tf") {
			$(".quiz").append(`
            <fieldset id='group-${i}' style="margin-bottom: 15px; border: none;">
                <div class='article-subtitle color-black mt-4 mb-4'> ${questions[i][1]} </div>
                <input type="radio" id="${i}.1" name="group-${i}" value="${i}.1" style="margin: 15px 0 10px 30px">
                <label for="${i}.1" class="article-content color-black"> ${questions[i][2]} </label><br>
                <input type="radio" id="${i}.2" name="group-${i}" value="${i}.2" style="margin: 0 0 10px 30px">
                <label for="${i}.2" class="article-content color-black"> ${questions[i][3]} </label><br>
            </fieldset>`);
		} else if (questions[i][0] == "frs") {
			$(".quiz").append(`
			<fieldset id='group-${i}' style="margin-bottom: 15px; border: none;">	
				<div class='article-subtitle color-black mt-4 mb-4' style='margin-bottom: 15px;'> ${questions[i][1]} </div>
				<input type="text" id="${i}.1" name="group-${i}" style="padding: 5px; font-size: 14px;" value=""></input>
			</fieldset>`);
		} else if (questions[i][0] == "fr") {
			$(".quiz").append(`
			<fieldset id='group-${i}' style="margin-bottom: 15px; border: none;">	
				<div class='article-subtitle color-black mt-4 mb-4' style='margin-bottom: 15px;'> ${
					questions[i][1]
				} </div>
				<div class="tabs mb-3"> <input type="radio" name="question-${i}" id="tab-question-${i}" checked="checked"> <label for="tab-question-${i}">${
				questions[i][3]
			}</label> <div class="tab">Code: <pre class="margin-0 padding-0"><code class='rounded-md code-text mt-2 padding-0.5 ${questions[
				i
			][3].toLowerCase()}'>${questions[i][2]}</code></pre></div> </div> </div>
				<input type="text" id="${i}.1" name="group-${i}" style="padding: 5px; font-size: 14px;" value=""></input>
			</fieldset>`);
		} else if (questions[i][0] == "mcc") {
			$(".quiz").append(`
            <fieldset id='group-${i}' style="margin-bottom: 15px; border: none;">
			<div class='article-subtitle color-black mt-4 mb-4' style='margin-bottom: 15px;'> ${
				questions[i][1]
			} </div>
			<div class="tabs mb-3"> <input type="radio" name="question-${i}" id="tab-question-${i}" checked="checked"> <label for="tab-question-${i}">${
				questions[i][3]
			}</label> <div class="tab">Code: <pre class="margin-0 padding-0"><code class='rounded-md code-text mt-2 padding-0.5 ${questions[
				i
			][3].toLowerCase()}'>${questions[i][2]}</code></pre></div> </div>

                <input type="radio" id="${i}.1" name="group-${i}" value="${i}.1" style="margin: 0px 0 10px 30px">
                <label for="${i}.1" class="article-content color-black"> ${
				questions[i][4]
			} </label><br>
                <input type="radio" id="${i}.2" name="group-${i}" value="${i}.2" style="margin: 0 0 10px 30px">
                <label for="${i}.2" class="article-content color-black"> ${
				questions[i][5]
			} </label><br>
                <input type="radio" id="${i}.3" name="group-${i}" value="${i}.3" style="margin: 0 0 10px 30px">
                <label for="${i}.3" class="article-content color-black"> ${
				questions[i][6]
			} </label><br>
                <input type="radio" id="${i}.4" name="group-${i}" value="${i}.4" style="margin: 0 0 10px 30px">
                <label for="${i}.4" class="article-content color-black"> ${
				questions[i][7]
			} </label>
            </fieldset>`);
		} else {
			$(".quiz").append(`
			<fieldset id='group-${i}' style="margin-bottom: 15px; border: none;">	
				<div class='article-subtitle color-black mt-4 mb-4' style='margin-bottom: 15px;'> ${
					questions[i][1]
				} </div>
				<div class="tabs mb-3"> <input type="radio" name="question-${i}" id="tab-question-${i}" checked="checked"> <label for="tab-question-${i}">${
				questions[i][4]
			}</label> <div class="tab">Code: <pre class="margin-0 padding-0"><code class='rounded-md code-text mt-2 padding-0.5 ${questions[
				i
			][4].toLowerCase()}' style='margin-bottom: 10px'>${
				questions[i][2]
			}</code></pre><br>
			Output: <pre class="margin-0 padding-0"><code class='rounded-md code-text mt-2 padding-0.5 ${questions[
				i
			][4].toLowerCase()}'>${questions[i][3]}</code></pre></div> </div> </div>
				<input type="text" id="${i}.1" name="group-${i}" style="padding: 5px; font-size: 14px;" value=""></input>
			</fieldset>`);
		}
	}
	if (!completed) {
		// $(".quiz").append(
		// 	`<div class= "hvr-darken color-white rounded-md btn-1" id="submit">Submit</div>`
		// );
	}
};

const updateScore = (uid) => {
	rt.ref("users/" + uid)
		.get()
		.then((snapshot) => {
			const data = snapshot.vaogin();
			store(data.school, data.score, data.questionsSolved);
			renderScore();
		});
};

const getQuestions = async (questionName, numbers, cat, school) => {
	try {
		localStore[questionName] = JSON.parse(localStorage.getItem(questionName));
	} catch {
		localStore[questionName] = undefined;
	}
	if (
		localStore[questionName] === (undefined || null) ||
		localStore[questionName].length < 1
	) {
		data = [];
		for (var i = 0; i < numbers.length; i++) {
			await rt
				.ref("questions/" + questionName + "/questions/" + numbers[i] + "/info")
				.get()
				.then((snapshot) => {
					const d = snapshot.val();
					data.push(d);
				});
		}
		localStorage.setItem(questionName, JSON.stringify(data));
		localStore[questionName] = data;
		location.reload();
	}

	renderQuestions(localStore[questionName], questionName);
	answerChecker(localStore[questionName], questionName, numbers, cat, school);
};

let locked = false;
const answerChecker = (questions, questionName, numbers, cat, school) => {
	$("#submit").on("click", (e) => {
		if (locked) {
			alert(
				"You are submitting too quickly! Wait 10 seconds between submissions"
			);
			return;
		}
		locked = true;
		setTimeout(() => {
			locked = false;
		}, 10000);
		let check = true;
		let answers = [];
		$("input:radio").each(function () {
			let name = $(this).attr("name");
			if ($("input:radio[name=" + name + "]:checked").length == 0) {
				check = false;
			}
		});
		$("input:text").each(function () {
			if ($(this).val() === "") {
				check = false;
			}
		});

		if (!check) {
			alert("Please answer each question.");
		} else {
			for (let i = 0; i < questions.length; i++) {
				if ($("input[name = group-" + i + "]").attr("type") == "radio") {
					answers.push(
						parseInt($(`input[name="group-${i}"]:checked`).val().substr(-1))
					);
				} else {
					answers.push($(`input[name="group-${i}"]`).val().trim());
				}
			}

			if (localStore.questionsSolved.indexOf(questionName) !== -1) {
				return;
			}

			const checkAnswers = firebase.functions().httpsCallable("checkAnswers");

			checkAnswers({
				answers: answers,
				questionName: questionName,
				questionNumbers: numbers,
				cat: cat - 1,
				school: school,
			})
				.then((result) => {
					if (result.data) {
						let user = firebase.auth().currentUser;
						localStore.questionsSolved.push(questionName);
						localStorage.setItem(
							"questionsSolved",
							JSON.stringify(localStore.questionsSolved)
						);
						rt.ref("users/" + user.uid + "/questionsSolved")
							.set(localStore.questionsSolved)
							.then((snapshot) => {
								$(".quiz").append(
									`<div id="quizResultsCorrect" style="text-align: center; background: lightGreen; border-radius: 50px; padding: 15px; margin-bottom: 0px; margin-top: 30px">
												<p style="margin: 0; font-size: 20px; font-weight: 600; color: white">Correct</p>
												</>`
								);
								document.getElementById("quizResultsCorrect").scrollIntoView();
								const userRef = rt.ref("users/" + user.uid);
								userRef
									.get()
									.then((snapshot) => {
										const data = snapshot.val();
										store(
											data.school,
											data.score,
											data.questionsSolved,
											data.randomNumbers
										);
									})
									.catch((error) => {
										console.error(error);
									});
								setTimeout(() => {
									window.location.href = "articles.html";
								}, 2500);
							});
					} else {
						$(".quiz").append(
							`<div id="quizResultsIncorrect" style="text-align: center; background: lightcoral; border-radius: 50px; padding: 15px; margin-bottom: 0px; margin-top: 30px">
										<p style="margin: 0; font-size: 20px; font-weight: 600; color: white">Incorrect</p>
										</div>`
						);
						document.getElementById("quizResultsIncorrect").scrollIntoView();
						setTimeout(() => {
							$("#quizResultsIncorrect").remove();
						}, 5000);
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}
	});
};
