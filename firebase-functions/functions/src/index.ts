import * as functions from "firebase-functions";
import admin = require("firebase-admin");

admin.initializeApp();

const db = admin.database();
const questionLengths = [
	6, 8, 8, 1, 1, 1, 10, 1, 1, 10, 1, 10, 6, 6, 6, 7, 10, 7, 6, 1,
];

exports.checkAnswers = functions.https.onCall(async (data, context) => {
	const uid = context?.auth?.uid;
	if (uid === (undefined || null)) {
		return false;
	}

	const questionName: string = data.questionName;
	const answers: (string | number)[] = data.answers;
	const questionNumbers: number[] = data.questionNumbers;
	const cat: number = data.cat;
	const school: string = data.school;

	const questionAnswers: number[] = [];
	for (let i = 0; i < 3; i++) {
		await db
			.ref(
				"/questions/" +
					questionName +
					"/questions/" +
					questionNumbers[i].toString() +
					"/answer"
			)
			.get()
			.then((snapshot) => {
				questionAnswers.push(snapshot.val());
			});
	}

	const isAnswerCorrect =
		answers.length === questionAnswers.length &&
		answers.every((element, index) => {
			return element == questionAnswers[index];
		});

	if (isAnswerCorrect) {
		let pts: number = data.pts;
		await db
			.ref("/questions/" + questionName + "/pts")
			.get()
			.then((snapshot) => {
				pts = snapshot.val();
			});
		const scoreRef = db.ref("users/" + uid + "/score/" + cat);
		scoreRef.set(admin.database.ServerValue.increment(pts));

		const schoolRef = db.ref("schools/" + school);
		schoolRef.set(admin.database.ServerValue.increment(pts));
	}

	return isAnswerCorrect;
});

exports.createUser = functions.https.onCall(async (data) => {
	const uid: string = data.uid;
	const school: string = data.school;

	let randomNumbersGenerated: number[] = [];
	for (let i = 0; i < 25; i++) {
		const temp = [];
		let j = 0;
		while (j < 3) {
			const r = Math.floor(Math.random() * questionLengths[i]);
			if (temp.indexOf(r) === -1) {
				temp.push(r);
				j++;
			}
		}
		randomNumbersGenerated = [...randomNumbersGenerated, ...temp];
	}
	db.ref("users/" + uid).set({
		score: [0, 0, 0],
		school: school,
		questionsSolved: ["placeholder"],
		randomNumbers: randomNumbersGenerated,
	});

	return randomNumbersGenerated;
});